/**
 * POST /api/admin/repair-paid-orders
 *
 * One-time repair endpoint that finds all PostgreSQL orders where
 * payChanguVerified = true AND status = 'pending', and updates them to 'paid'.
 * Also syncs the Sanity order status.
 *
 * This is needed because the verify/route.ts was pointing to the wrong
 * Vercel URL ('lutoshoppingstore.vercel.app' instead of 'pluto-shopping-store.vercel.app'),
 * which caused the self-webhook call to silently fail, leaving orders stuck on 'pending'.
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { backendClient } from "@/sanity/lib/backendClient";

export async function POST(req: NextRequest) {
  // Simple admin guard — check for a secret header
  const adminSecret = req.headers.get("x-admin-secret");
  if (adminSecret !== process.env.PAYCHANGU_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Find all Postgres orders that PayChangu verified but status wasn't updated
    const stuckOrders = await prisma.order.findMany({
      where: {
        payChanguVerified: true,
        status: "pending",
      },
    });

    console.log(`🔧 Found ${stuckOrders.length} stuck paid orders to repair`);

    if (stuckOrders.length === 0) {
      return NextResponse.json({ message: "No stuck orders found. All good!", repaired: 0 });
    }

    const results = [];

    for (const order of stuckOrders) {
      try {
        // 2. Update Postgres status to 'paid'
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "paid" },
        });

        // 3. Try to sync Sanity order status too
        let sanityUpdated = false;
        try {
          let sanityOrder = null;

          // Try by orderNumber first
          sanityOrder = await backendClient.fetch(
            `*[_type == "order" && orderNumber == $orderNumber][0]`,
            { orderNumber: order.orderNumber }
          );

          // Fallback: try by chargeId
          if (!sanityOrder && order.payChanguChargeId) {
            sanityOrder = await backendClient.fetch(
              `*[_type == "order" && paychangu.charge_id == $chargeId][0]`,
              { chargeId: order.payChanguChargeId }
            );
          }

          if (sanityOrder?._id) {
            await backendClient
              .patch(sanityOrder._id)
              .set({ status: "paid" })
              .commit();
            sanityUpdated = true;
          }
        } catch (sanityErr) {
          console.error(`Sanity update failed for order ${order.orderNumber}:`, sanityErr);
        }

        results.push({
          orderNumber: order.orderNumber,
          postgresUpdated: true,
          sanityUpdated,
        });

        console.log(`✅ Repaired order ${order.orderNumber} (Sanity: ${sanityUpdated})`);
      } catch (err) {
        console.error(`❌ Failed to repair order ${order.orderNumber}:`, err);
        results.push({
          orderNumber: order.orderNumber,
          postgresUpdated: false,
          error: String(err),
        });
      }
    }

    return NextResponse.json({
      message: `Repaired ${results.filter(r => r.postgresUpdated).length} of ${stuckOrders.length} orders`,
      repaired: results.filter(r => r.postgresUpdated).length,
      results,
    });
  } catch (error: any) {
    console.error("Repair endpoint error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
