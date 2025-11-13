import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Log the raw payload for debugging
    console.log("🔔 PayChangu Webhook received:", payload);

    if (payload.status === "success") {
      console.log("✅ Payment successful for order:", payload.orderId || payload);

      // TODO: save order to database
      // TODO: mark order as paid
    } else {
      console.log("⚠️ Payment status not successful:", payload.status);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
