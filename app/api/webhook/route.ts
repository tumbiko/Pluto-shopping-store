import { NextResponse } from "next/server";

export async function POST(req: Request) {
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

    // Early exit for unsupported events
    if (!body?.status) {
      console.error("❌ Webhook missing status field");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 3. On a successful payment
    if (body.status === "success") {
      console.log("💰 Payment marked SUCCESS — Updating Sanity…");

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
                  // Make sure this matches your Sanity order document _id
                  id: body.charge_id,
                  set: {
                    status: "paid",
                    transactionId: body.trans_id,
                    completedAt: new Date().toISOString(),
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
