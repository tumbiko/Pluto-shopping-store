import { NextRequest, NextResponse } from "next/server";
import paychangu from "@api/paychangu";

const PAYCHANGU_API_KEY = process.env.PAYCHANGU_API_KEY!;
const CALLBACK_URL = process.env.PAYCHANGU_CALLBACK_URL!;
const RETURN_URL = process.env.PAYCHANGU_RETURN_URL!;

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

    // Fetch operators
    const opRes = await fetch("https://api.paychangu.com/mobile-money/");
    const opData: {
      status: string;
      data: {
        name: string;
        ref_id: string;
      }[];
    } = await opRes.json();

    if (opData.status !== "success") {
      return NextResponse.json(
        { status: "failed", message: "Failed to fetch operators" },
        { status: 500 }
      );
    }

    let operatorRefId: string | undefined;
    const operators = opData.data;

    if (mobile.startsWith("+26588") || mobile.startsWith("+26599")) {
      operatorRefId = operators.find(op => op.name.toLowerCase().includes("tnm"))?.ref_id;
    } else if (mobile.startsWith("+26595") || mobile.startsWith("+26596")) {
      operatorRefId = operators.find(op => op.name.toLowerCase().includes("airtel"))?.ref_id;
    }

    if (!operatorRefId) {
      return NextResponse.json(
        { status: "failed", message: "Unsupported mobile operator" },
        { status: 400 }
      );
    }

    // 🔥 SDK MUST be configured before calling any endpoint
    paychangu.server("https://api.paychangu.com");
    paychangu.auth(`Bearer ${PAYCHANGU_API_KEY}`);

    const payload = {
      amount: amount.toString(),
      currency: "MWK",
      tx_ref: `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      callback_url: CALLBACK_URL,
      return_url: RETURN_URL,
      email,
      first_name,
      last_name,
      mobile,
      mobile_money_operator_ref_id: operatorRefId,
    };

    console.log("📦 Final SDK Payload:", payload);

    const response = await paychangu.initiateTransaction(payload);

    return NextResponse.json(response.data);
  } catch (err: unknown) {
    console.log("❌ PayChangu Error:", err);
  }
}
