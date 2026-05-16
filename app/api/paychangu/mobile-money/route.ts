import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, operator, amount, email, first_name, last_name } = body;

    // Validate required fields
    if (!mobile || !operator || !amount || !email) {
      return NextResponse.json(
        { status: "failed", message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("📌 PayChangu request payload:", body);

    // Call PayChangu API
    const res = await fetch("https://api.paychangu.com/mobile-money/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
      },
      body: JSON.stringify({
        operator,
        mobile,
        amount,
        email,
        first_name,
        last_name,
      }),
    });

    // Read raw text first (in case JSON parsing fails)
    const text = await res.text();
    console.log("📤 Raw PayChangu response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonErr) {
      console.error("❌ Failed to parse PayChangu response as JSON:", jsonErr);
      data = { status: "failed", message: "Invalid response from PayChangu" };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("❌ PayChangu endpoint error:", err);
    return NextResponse.json(
      { status: "failed", message: "Internal server error" },
      { status: 500 }
    );
  }
}
