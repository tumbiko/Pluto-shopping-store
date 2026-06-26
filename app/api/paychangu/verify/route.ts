import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { backendClient } from "@/sanity/lib/backendClient";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const charge_id = url.searchParams.get("charge_id");

    if (!charge_id) {
      return NextResponse.json(
        { status: "failed", message: "Missing charge_id" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYCHANGU_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { status: "failed", message: "Missing PAYCHANGU_SECRET_KEY" },
        { status: 500 }
      );
    }

    // Call PayChangu verify endpoint
    const res = await fetch(
      `https://api.paychangu.com/mobile-money/payments/${charge_id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          Accept: "application/json",
        },
      }
    );

    const data = await res.json();
    console.log("🔍 PayChangu VERIFY response:", data);

    const statusLower = (data.data?.status || data.status || "").toLowerCase();
    const isPaid = statusLower === "success" || statusLower === "successful" || statusLower === "verified";

    // ✅ If payment successful, update Postgres and Sanity directly
    if (isPaid) {
      try {
        const paymentData = data.data || data;
        const finalChargeId = paymentData.charge_id ? String(paymentData.charge_id) : charge_id;
        const txRef = paymentData.ref_id || paymentData.tx_ref || paymentData.txRef;

        console.log(`💾 Direct update for verified payment — finalChargeId: ${finalChargeId}, txRef: ${txRef}`);

        // 1. Try to find the Postgres order
        let pgOrder = null;
        if (txRef) {
          pgOrder = await prisma.order.findUnique({ where: { orderNumber: String(txRef) } });
        }
        if (!pgOrder && finalChargeId) {
          pgOrder = await prisma.order.findFirst({ where: { payChanguChargeId: finalChargeId } });
        }
        if (!pgOrder && finalChargeId) {
          pgOrder = await prisma.order.findUnique({ where: { orderNumber: finalChargeId } });
        }

        if (pgOrder) {
          await prisma.order.update({
            where: { id: pgOrder.id },
            data: {
              status: "paid",
              payChanguStatus: "verified",
              payChanguChargeId: finalChargeId,
              payChanguTransactionId: txRef || finalChargeId,
              payChanguAmount: paymentData.amount ? Number(paymentData.amount) : null,
              payChanguVerified: true,
            }
          });
          console.log(`✅ Postgres order ${pgOrder.orderNumber} directly updated to paid`);
        } else {
          console.error(`❌ Postgres update error: Could not find matching order for finalChargeId: ${finalChargeId}, txRef: ${txRef}`);
        }

        // 2. Try to update the Sanity order
        let sanityOrder = null;
        if (txRef) {
          sanityOrder = await backendClient.fetch(`*[_type == "order" && orderNumber == $txRef][0]`, { txRef: String(txRef) });
        }
        if (!sanityOrder && finalChargeId) {
          sanityOrder = await backendClient.fetch(`*[_type == "order" && paychangu.chargeId == $finalChargeId][0]`, { finalChargeId });
        }
        if (!sanityOrder && finalChargeId) {
          sanityOrder = await backendClient.fetch(`*[_type == "order" && orderNumber == $finalChargeId][0]`, { finalChargeId });
        }

        if (sanityOrder && sanityOrder._id) {
          if (sanityOrder.status === "paid") {
            console.log("⚠️ Sanity order is already marked as paid. Skipping stock deduction.");
          } else {
            await backendClient.patch(sanityOrder._id)
              .set({
                status: "paid",
                paychangu: {
                  chargeId: finalChargeId,
                  refId: txRef || finalChargeId,
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
            console.log("📦 Sanity Order Update: SUCCESS");

            // Decrement product stock levels
            if (sanityOrder.products && Array.isArray(sanityOrder.products)) {
              for (const item of sanityOrder.products) {
                if (item.product && item.product._ref && item.quantity) {
                  const productRef = item.product._ref;
                  const qty = Number(item.quantity);
                  const productDoc = await backendClient.getDocument(productRef) as any;
                  if (productDoc && typeof productDoc.stock === "number") {
                    const newStock = Math.max(productDoc.stock - qty, 0);
                    await backendClient.patch(productRef).set({ stock: newStock }).commit();
                    console.log(`✅ Decremented stock for product ${productRef} to ${newStock}`);
                  }
                }
              }
            }
          }
        } else {
          console.error(`❌ Sanity order not found for finalChargeId: ${finalChargeId}, txRef: ${txRef}`);
        }
      } catch (err) {
        console.error("❌ Error performing direct updates in verify route:", err);
      }
    }



    // Return cleaned-up response for frontend
    return NextResponse.json({
      status: data.data?.status || data.status || "pending",
      data: {
        charge_id: data.data?.charge_id || null,
        ref_id: data.data?.ref_id || null,
        amount: data.data?.amount || null,
        mobile: data.data?.mobile || null,
        mobile_money: {
          name: data.data?.mobile_money?.name || null,
        },
        transaction_charges: data.data?.transaction_charges || null,
        first_name: data.data?.first_name || null,
        last_name: data.data?.last_name || null,
        email: data.data?.email || null,
        completed_at: data.data?.completed_at || null,
      },
      raw: data,
    });
  } catch (error) {
    console.error("❌ Error verifying charge:", error);
    return NextResponse.json(
      { status: "pending", message: "Network or server verify error" },
      { status: 200 } // keep 200 so frontend does not immediately treat as failed
    );
  }
}
