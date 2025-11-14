import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch operators directly from PayChangu REST API
    const res = await fetch("https://api.paychangu.com/mobile-money/");
    const data = await res.json();

    if (data.status !== "success") {
      return NextResponse.json(
        { status: "failed", message: "Failed to fetch operators" },
        { status: 500 }
      );
    }

    // Return the list of operators
    return NextResponse.json({ status: "success", data: data.data });
  }catch (error: unknown) {
  console.error("❌ PayChangu API error:", error);

  const message =
    error instanceof Error ? error.message : "Internal server error";

  return NextResponse.json(
    { status: "failed", message },
    { status: 500 }
  );
}
}
