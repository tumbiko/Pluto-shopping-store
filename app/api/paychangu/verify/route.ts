import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const charge_id = url.searchParams.get("charge_id");

    if (!charge_id) {
      return NextResponse.json(
        { status: "failed", message: "Missing charge_id" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYCHANGU_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { status: "failed", message: "Missing PAYCHANGU_SECRET_KEY" },
        { status: 500 }
      );
    }

    // Call PayChangu verify endpoint
    const res = await fetch(
      `https://api.paychangu.com/mobile-money/payments/${charge_id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          Accept: "application/json",
        },
      }
    );

    const data = await res.json();
    console.log("🔍 PayChangu VERIFY response:", data);

   // ✅ If payment successful, call your webhook to update stock
if (data.data?.status === "success" || data.status === "successful") {
  try {
    // Use Vercel app URL in production, fallback to localhost for dev
    const siteUrl =
      process.env.NODE_ENV === "production"
        ? "https://pluto-shopping-store.vercel.app"
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    console.log("🌐 Triggering webhook at:", `${siteUrl}/api/webhook`);
    await fetch(`${siteUrl}/api/webhook`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-webhook-signature": process.env.PAYCHANGU_WEBHOOK_SECRET || "",
      },
      body: JSON.stringify({ order: data.data }), // send full order data
    });
    console.log("✅ Webhook triggered successfully");
  } catch (err) {
    console.error("❌ Error triggering webhook:", err);
  }
}



    // Return cleaned-up response for frontend
    return NextResponse.json({
      status: data.data?.status || data.status || "pending",
      data: {
        charge_id: data.data?.charge_id || null,
        ref_id: data.data?.ref_id || null,
        amount: data.data?.amount || null,
        mobile: data.data?.mobile || null,
        mobile_money: {
          name: data.data?.mobile_money?.name || null,
        },
        transaction_charges: data.data?.transaction_charges || null,
        first_name: data.data?.first_name || null,
        last_name: data.data?.last_name || null,
        email: data.data?.email || null,
        completed_at: data.data?.completed_at || null,
      },
      raw: data,
    });
  } catch (error) {
    console.error("❌ Error verifying charge:", error);
    return NextResponse.json(
      { status: "pending", message: "Network or server verify error" },
      { status: 200 } // keep 200 so frontend does not immediately treat as failed
    );
  }
}
