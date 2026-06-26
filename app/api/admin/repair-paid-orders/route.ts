/**
 * GET /api/admin/repair-paid-orders?secret=<PAYCHANGU_WEBHOOK_SECRET>
 *
 * Repair endpoint: finds all PostgreSQL orders where payChanguVerified = true
 * AND status = 'pending', and updates them to 'paid'. Also syncs Sanity.
 *
 * Trigger via browser or PowerShell:
 *   https://pluto-shopping-store.vercel.app/api/admin/repair-paid-orders?secret=mystrongwebhooksecret2121
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { backendClient } from "@/sanity/lib/backendClient";

export async function GET(req: NextRequest) {
  // Simple guard — check secret query param
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.PAYCHANGU_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all Postgres orders that PayChangu verified but status wasn't updated
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
        // Update Postgres status to 'paid'
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "paid" },
        });

        // Try to sync Sanity order status too
        let sanityUpdated = false;
        try {
          let sanityOrder = await backendClient.fetch(
            `*[_type == "order" && orderNumber == $orderNumber][0]`,
            { orderNumber: order.orderNumber }
          );

          if (!sanityOrder && order.payChanguChargeId) {
            sanityOrder = await backendClient.fetch(
              `*[_type == "order" && paychangu.chargeId == $chargeId][0]`,
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
          console.error(`Sanity update failed for ${order.orderNumber}:`, sanityErr);
        }

        results.push({ orderNumber: order.orderNumber, postgresUpdated: true, sanityUpdated });
        console.log(`✅ Repaired order ${order.orderNumber} (Sanity: ${sanityUpdated})`);
      } catch (err) {
        results.push({ orderNumber: order.orderNumber, postgresUpdated: false, error: String(err) });
      }
    }

    return NextResponse.json({
      message: `Repaired ${results.filter(r => r.postgresUpdated).length} of ${stuckOrders.length} orders`,
      repaired: results.filter(r => r.postgresUpdated).length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
