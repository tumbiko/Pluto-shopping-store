import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body
    const body = await req.json();

    // 2. Verify webhook signature
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

    // Extract charge_id from order data
    const chargeId = body.order?.charge_id || body.charge_id;
    const status = body.order?.status || body.status;

    // Early exit for unsupported events
    if (!chargeId || !status) {
      console.error("❌ Webhook missing charge_id or status field");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 3. On a successful payment
    if (status === "success" || status === "successful") {
      console.log("💰 Payment marked SUCCESS — Updating Sanity…");

      const paymentData = body.order || body;

      const sanityRes = await fetch(
        `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2023-08-01/data/mutate/production`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`,
          },
          body: JSON.stringify({
            mutations: [
              {
                patch: {
                  // Use charge_id as the order document _id
                  id: chargeId,
                  set: {
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
                    },
                  },
                },
              },
            ],
          }),
        }
      );

      const sanityResult = await sanityRes.json();
      console.log("📦 Sanity Update Result:", sanityResult);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
