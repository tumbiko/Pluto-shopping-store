import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const charge_id = url.searchParams.get("charge_id");

    if (!charge_id) {
      return NextResponse.json({ status: "failed", message: "Missing charge_id" }, { status: 400 });
    }

    const res = await fetch("https://api.paychangu.com/mobile-money/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
      },
      body: JSON.stringify({ charge_id }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json({ status: "failed", message: "Server error" }, { status: 500 });
  }
}
