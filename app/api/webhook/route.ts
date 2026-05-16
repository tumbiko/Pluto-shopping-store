import { NextRequest, NextResponse } from "next/server";
import { backendClient } from "@/sanity/lib/backendClient";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const secret = process.env.PAYCHANGU_WEBHOOK_SECRET;
    const signature = req.headers.get("x-webhook-signature");

    if (!secret) {
      console.error("❌ Missing PAYCHANGU_WEBHOOK_SECRET in environment variables");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (signature !== secret) {
      console.error("❌ Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("🔔 PayChangu Webhook Received:", body);

    const chargeId = body.order?.charge_id || body.charge_id;
    const status = body.order?.status || body.status;

    if (!chargeId || !status) {
      console.error("❌ Webhook missing charge_id or status field");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (status === "success" || status === "successful") {
      console.log("💰 Payment marked SUCCESS — Updating Sanity and Postgres…");

      const paymentData = body.order || body;

      try {
        await prisma.order.update({
          where: { orderNumber: chargeId },
          data: {
            status: "paid",
            payChanguStatus: "verified",
            payChanguChargeId: paymentData.charge_id,
            payChanguTransactionId: paymentData.ref_id,
            payChanguAmount: paymentData.amount,
            payChanguVerified: true,
          }
        });
        console.log("✅ Postgres order updated to paid");
      } catch (err) {
        console.error("❌ Postgres update error:", err);
      }

      try {
        const sanityOrder = await backendClient.fetch(
          `*[_type == "order" && orderNumber == $chargeId][0]`,
          { chargeId }
        );

        if (sanityOrder && sanityOrder._id) {
          if (sanityOrder.status === "paid") {
            console.log("⚠️ Sanity order is already marked as paid. Skipping stock deduction to avoid double counting.");
          } else {
            await backendClient.patch(sanityOrder._id)
            .set({
              status: "paid",
              paychangu: {
                chargeId: paymentData.charge_id,
                refId: paymentData.ref_id,
                amount: paymentData.amount,
                mobile: paymentData.mobile,
                mobileMoneyProvider: paymentData.mobile_money?.name,
                transactionCharges: paymentData.transaction_charges,
                status: "verified",
                verified: true,
                completedAt: paymentData.completed_at || new Date().toISOString(),
              }
            })
            .commit();
          console.log("📦 Sanity Order Update Result: SUCCESS");

          if (sanityOrder.products && Array.isArray(sanityOrder.products)) {
            for (const item of sanityOrder.products) {
              if (item.product && item.product._ref && item.quantity) {
                const productRef = item.product._ref;
                const qty = Number(item.quantity);
                const productDoc = await backendClient.getDocument(productRef);
                if (productDoc && typeof productDoc.stock === "number") {
                  const newStock = Math.max((productDoc.stock as number) - qty, 0);
                  await backendClient.patch(productRef).set({ stock: newStock }).commit();
                  console.log(`✅ Decremented stock for product ${productRef} to ${newStock}`);
                }
              }
            }
          }
          } // close the else block for status === "paid"
        } else {
          console.error("❌ Sanity order not found for chargeId:", chargeId);
        }
      } catch (err) {
        console.error("❌ Sanity update error:", err);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
