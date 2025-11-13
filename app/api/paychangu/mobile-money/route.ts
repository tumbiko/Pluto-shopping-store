import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📲 /mobile-money received payload:", body);

    // Check required fields
    if (!body.phone || !body.amount || !body.email || !body.firstName || !body.lastName) {
      console.warn("⚠️ Missing required fields in payload");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prepare payload for PayChangu
    const payload = {
      mobile: body.phone,
      amount: String(body.amount),
      charge_id: crypto.randomUUID(),
      mobile_money_operator_ref_id: "20be6c20-adeb-4b5b-a7ba-0769820df4fb", // Replace with your real operator ID if needed
      email: body.email,
      first_name: body.firstName,
      last_name: body.lastName,
    };

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

    // Success
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ /mobile-money API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
