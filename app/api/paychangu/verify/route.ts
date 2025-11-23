import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tx_ref = searchParams.get("tx_ref");

    if (!tx_ref) {
      return NextResponse.json(
        { status: "failed", message: "tx_ref is required" },
        { status: 400 }
      );
    }

    // Call PayChangu verify endpoint
    const res = await fetch(`https://api.paychangu.com/mobile-money/verify/${tx_ref}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("❌ Failed to parse PayChangu verify response:", err);
      return NextResponse.json({ status: "failed", message: "Invalid response from PayChangu" }, { status: 500 });
    }

    // Return PayChangu response to frontend
    return NextResponse.json(data, { status: res.status });

  } catch (err) {
    console.error("❌ Verify endpoint error:", err);
    return NextResponse.json({ status: "failed", message: "Internal server error" }, { status: 500 });
  }
}
