import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const secretKey = process.env.PAYCHANGU_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { status: "failed", message: "Missing PAYCHANGU_SECRET_KEY" },
      { status: 500 }
    );
  }

  try {
    // Initialize payment with PayChangu
    const res = await fetch("https://api.paychangu.com/mobile-money/payments/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // Important: return charge_id so frontend can poll
    return NextResponse.json({
      status: data.status || "pending",
      message: data.message || "Payment initiated",
      charge_id: data.data?.charge_id || null, // this is what we need to poll
      info: "Use charge_id to check payment status via webhook or polling",
    });
  } catch (error) {
    console.error("PayChangu mobile money error:", error);
    return NextResponse.json(
      { status: "failed", message: "Payment initiation failed" },
      { status: 500 }
    );
  }
}
