import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const secretKey = process.env.PAYCHANGU_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { status: "failed", message: "Missing PAYCHANGU_SECRET_KEY" },
        { status: 500 }
      );
    }

    // 🔍 Validate required fields PayChangu expects
    const required = ["mobile", "mobile_money_operator_ref_id", "amount", "email"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { status: "failed", message: `Missing field: ${field}` },
          { status: 400 }
        );
      }
    }

    console.log("📌 Initializing PayChangu mobile money charge:", body);

    const { items, metadata, ...payChanguPayload } = body;

    if (items && metadata) {
      try {
        const { createOrderInPostgres } = await import("@/Actions/createOrderInPostgres");
        const { createOrderInSanity } = await import("@/Actions/CreateOrderInSanity");
        await Promise.all([
          createOrderInPostgres(items, metadata),
          createOrderInSanity(items, metadata)
        ]);
        console.log("✅ Pending order created in Postgres and Sanity");
      } catch (e) {
        console.error("❌ Error creating pending order in DBs:", e);
      }
    }

    // ✅ Call the official initialize endpoint
    const res = await fetch(
      "https://api.paychangu.com/mobile-money/payments/initialize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify(payChanguPayload),
      }
    );

    const data = await res.json();
    console.log("📤 PayChangu initialize response:", data);

    // ❗Ensure we extract the real charge_id correctly
    const chargeId =
      data?.data?.chargeId ||
      data?.data?.charge_id ||
      data?.chargeId ||
      data?.charge_id ||
      null;

    if (!chargeId) {
      console.warn("⚠️ PayChangu returned no charge_id");
    }

    return NextResponse.json(
      {
        status: data.status ?? "pending", // PayChangu usually returns "success" here
        message: data.message ?? "Payment initiated",
        charge_id: chargeId,
        raw: data, // optional for debugging
      },
      { status: res.status }
    );
  } catch (error) {
    console.error("❌ PayChangu initialize error:", error);
    return NextResponse.json(
      { status: "failed", message: "Payment initiation failed" },
      { status: 500 }
    );
  }
}
