import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://api.paychangu.com/mobile-money", {
      headers: {
        Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Operator fetch error:", err);
    return NextResponse.json(
      { status: "failed", message: "Unable to fetch operators" },
      { status: 500 }
    );
  }
}
