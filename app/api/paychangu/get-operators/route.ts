import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const res = await fetch("https://api.paychangu.com/mobile-money/", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.PAYCHANGU_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ status: "failed", message: text }, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json({
      status: data.status || "success",
      message: data.message || "",
      data: data.data || [],
    });
  } catch (error) {
    console.error("Error fetching PayChangu operators:", error);
    return NextResponse.json({ status: "failed", message: "Internal server error", data: [] }, { status: 500 });
  }
}
