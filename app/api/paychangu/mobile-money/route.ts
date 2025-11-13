import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📲 /mobile-money received payload:", body);

    // Check required field
    if (!body.amount) {
      console.warn("⚠️ Missing required field: amount");
      return NextResponse.json(
        { error: "Missing required field: amount" },
        { status: 400 }
      );
    }

    // Build payload for PayChangu
    const payload: Record<string, string> = {
      amount: String(body.amount),
      charge_id: crypto.randomUUID(),
      mobile_money_operator_ref_id: "20be6c20-adeb-4b5b-a7ba-0769820df4fb",
    };

    // Optionally include email for notifications
    if (body.email) {
      payload.email = body.email;
    }

    console.log("💳 Sending to PayChangu:", payload);

    const res = await fetch(
      "https://api.paychangu.com/mobile-money/payments/initialize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    console.log("📤 PayChangu response:", data, "Status:", res.status);

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || "Payment initialization failed" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ /mobile-money API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
