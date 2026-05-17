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

    const paymentData = body.order || body;
    const chargeId = paymentData.charge_id ? String(paymentData.charge_id) : null;
    const txRef = paymentData.tx_ref || paymentData.ref_id || paymentData.txRef; 
    const status = paymentData.status;

    if (!chargeId || !status) {
      console.error("❌ Webhook missing charge_id or status field");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (status === "success" || status === "successful") {
      console.log(`💰 Payment marked SUCCESS — Looking for order (txRef: ${txRef}, chargeId: ${chargeId})`);

      try {
        let order = null;
        
        // 1. Try to find by tx_ref (which is our original orderNumber)
        if (txRef) {
          order = await prisma.order.findUnique({ where: { orderNumber: String(txRef) } });
        }
        
        // 2. Fallback: try finding by payChanguChargeId (which we now save during init)
        if (!order && chargeId) {
          order = await prisma.order.findFirst({ where: { payChanguChargeId: chargeId } });
        }
        
        // 3. Fallback: maybe orderNumber IS the chargeId
        if (!order && chargeId) {
          order = await prisma.order.findUnique({ where: { orderNumber: chargeId } });
        }

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: "paid",
              payChanguStatus: "verified",
              payChanguChargeId: chargeId,
              payChanguTransactionId: txRef || chargeId,
              payChanguAmount: paymentData.amount,
              payChanguVerified: true,
            }
          });
          console.log(`✅ Postgres order ${order.orderNumber} updated to paid`);
        } else {
          console.error("❌ Postgres update error: Could not find matching order.");
        }
      } catch (err) {
        console.error(`❌ Postgres update error:`, err);
      }

      try {
        let sanityOrder = null;
        
        if (txRef) {
          sanityOrder = await backendClient.fetch(`*[_type == "order" && orderNumber == $txRef][0]`, { txRef: String(txRef) });
        }
        
        if (!sanityOrder && chargeId) {
          sanityOrder = await backendClient.fetch(`*[_type == "order" && paychangu.chargeId == $chargeId][0]`, { chargeId });
        }
        
        if (!sanityOrder && chargeId) {
          sanityOrder = await backendClient.fetch(`*[_type == "order" && orderNumber == $chargeId][0]`, { chargeId });
        }

        if (sanityOrder && sanityOrder._id) {
          if (sanityOrder.status === "paid") {
            console.log("⚠️ Sanity order is already marked as paid. Skipping stock deduction to avoid double counting.");
          } else {
            await backendClient.patch(sanityOrder._id)
            .set({
              status: "paid",
              paychangu: {
                chargeId: chargeId,
                refId: txRef || chargeId,
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
