import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const secretKey = process.env.PAYCHANGU_SECRET_KEY;
  if (!secretKey)
    return NextResponse.json({ status: "failed", message: "Missing API key" }, { status: 500 });

  const res = await fetch("https://api.paychangu.com/mobile-money", {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("PayChangu fetch operators error:", res.status, text);
    return NextResponse.json({ status: "failed", message: "Cannot fetch operators" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
