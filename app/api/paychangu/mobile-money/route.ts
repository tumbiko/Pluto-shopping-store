import { NextRequest, NextResponse } from "next/server";
import paychangu from "@api/paychangu";

const PAYCHANGU_API_KEY = process.env.PAYCHANGU_API_KEY!;
const CALLBACK_URL = process.env.PAYCHANGU_CALLBACK_URL!; // e.g., https://yourdomain.com/payment-callback
const RETURN_URL = process.env.PAYCHANGU_RETURN_URL!; // e.g., https://yourdomain.com/order-success

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, amount, email, first_name, last_name } = body;

    if (!mobile || !amount) {
      return NextResponse.json(
        { status: "failed", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Normalize phone
    let phone = mobile.toString().trim();
    if (!phone.startsWith("+265")) {
      if (phone.startsWith("0")) phone = phone.slice(1);
      phone = `+265${phone}`;
    }

    if (!/^\+265\d{9}$/.test(phone)) {
      return NextResponse.json(
        { status: "failed", message: "Invalid mobile number format. Must be +265XXXXXXXXX" },
        { status: 400 }
      );
    }

    // Authenticate SDK
    paychangu.auth(PAYCHANGU_API_KEY);

    // Build SDK payload
    const sdkPayload = {
      amount: amount.toString(),
      currency: "MWK",
      tx_ref: `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      callback_url: CALLBACK_URL,
      return_url: RETURN_URL,
      email,
      first_name: first_name || "Customer",
      last_name: last_name || "",
      mobile: phone,
    };

    console.log("💳 SDK Payload:", sdkPayload);

    // Call SDK
    const response = await paychangu.initiateTransaction(sdkPayload);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("❌ PayChangu SDK error:", error);
    return NextResponse.json(
      { status: "failed", message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
