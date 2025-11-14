import { NextRequest, NextResponse } from "next/server";
import paychangu from "@api/paychangu";

// ENV
const PAYCHANGU_API_KEY = process.env.PAYCHANGU_API_KEY!;
const CALLBACK_URL = process.env.PAYCHANGU_CALLBACK_URL!;
const RETURN_URL = process.env.PAYCHANGU_RETURN_URL!;

// ----------------------
// TYPES
// ----------------------
interface MobileMoneyOperator {
  id: number;
  name: string;
  ref_id: string;
  short_code: string;
  logo: string | null;
  supported_country: {
    name: string;
    currency: string;
  };
  prefixes?: string[];
}

// ----------------------
// API HANDLER
// ----------------------
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

    // Normalize mobile number
    const phone = mobile.startsWith("+") ? mobile : `+${mobile}`;

    console.log("📌 Phone being used:", phone);

    // -------------------------------------------
    // 1️⃣ Get Operators (Live from PayChangu API)
    // -------------------------------------------
    const opRes = await fetch("https://api.paychangu.com/mobile-money/");
    const opData = await opRes.json();

    if (opData.status !== "success") {
      return NextResponse.json(
        { status: "failed", message: "Failed to fetch operators" },
        { status: 500 }
      );
    }

    const operators: MobileMoneyOperator[] = opData.data;

    // -------------------------------------------
    // 2️⃣ Match operator using PREFIXES
    // -------------------------------------------
    const operator =
      operators.find((op: MobileMoneyOperator) => {
        const prefixes = op.prefixes || [];
        return prefixes.some((p) => phone.startsWith(p));
      }) ||
      // 2B: Fallback logic by phone ranges
      operators.find((op: MobileMoneyOperator) => {
        const name = op.name.toLowerCase();
        if (phone.startsWith("+26588") || phone.startsWith("+26599"))
          return name.includes("tnm");
        if (phone.startsWith("+26595") || phone.startsWith("+26596"))
          return name.includes("airtel");
        return false;
      });

    console.log("📡 Operator matched:", operator);

    if (!operator) {
      return NextResponse.json(
        { status: "failed", message: "Unsupported mobile money operator" },
        { status: 400 }
      );
    }

    // -------------------------------------------
    // 3️⃣ Authenticate SDK
    // -------------------------------------------
    paychangu.auth(PAYCHANGU_API_KEY);

    // -------------------------------------------
    // 4️⃣ Build PayChangu SDK payload
    // -------------------------------------------
    const sdkPayload = {
      amount: amount.toString(),
      currency: "MWK",
      tx_ref: `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      callback_url: CALLBACK_URL,
      return_url: RETURN_URL,
      email,
      first_name,
      last_name,
      mobile: phone,
      mobile_money_operator_ref_id: operator.ref_id,
    };

    console.log("💳 SDK Payload:", sdkPayload);

    // -------------------------------------------
    // 5️⃣ Initiate Mobile Money Transaction
    // -------------------------------------------
    const response = await paychangu.initiateTransaction(sdkPayload);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
  console.error("❌ PayChangu API error:", error);

  const message =
    error instanceof Error ? error.message : "Internal server error";

  return NextResponse.json(
    { status: "failed", message },
    { status: 500 }
  );
}
}
