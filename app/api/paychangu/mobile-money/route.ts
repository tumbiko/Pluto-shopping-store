import { NextRequest, NextResponse } from "next/server";

const PAYCHANGU_API_KEY = process.env.PAYCHANGU_API_KEY!;
const CALLBACK_URL = process.env.PAYCHANGU_CALLBACK_URL!;
const RETURN_URL = process.env.PAYCHANGU_RETURN_URL!;

export async function POST(req: NextRequest) {
  try {
    const { mobile, amount, email, first_name, last_name } = await req.json();

    if (!mobile || !amount) {
      return NextResponse.json(
        { status: "failed", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Fetch operators
    const operatorRes = await fetch("https://api.paychangu.com/mobile-money/", {
      headers: {
        Authorization: `Bearer ${PAYCHANGU_API_KEY}`,
      },
    });

    const operatorData = await operatorRes.json();

    if (operatorData.status !== "success") {
      return NextResponse.json(
        { status: "failed", message: "Could not fetch operators" },
        { status: 500 }
      );
    }

    const operators = operatorData.data;

    // 2. Determine operator
    type Operator = { ref_id: string; name: string };

    let operatorRefId: string | null = null;

    for (const op of operators as Operator[]) {
      const name = op.name.toLowerCase();

      if (
        (mobile.startsWith("+26588") || mobile.startsWith("+26599")) &&
        name.includes("tnm")
      ) {
        operatorRefId = op.ref_id;
      }

      if (
        (mobile.startsWith("+26595") || mobile.startsWith("+26596")) &&
        name.includes("airtel")
      ) {
        operatorRefId = op.ref_id;
      }
    }

    if (!operatorRefId) {
      return NextResponse.json(
        { status: "failed", message: "Unsupported operator" },
        { status: 400 }
      );
    }

    // 3. Charge mobile money
    const payload = {
      amount: amount.toString(),
      currency: "MWK",
      tx_ref: `txn_${Date.now()}`,
      email,
      first_name,
      last_name,
      mobile,
      callback_url: CALLBACK_URL,
      return_url: RETURN_URL,
      mobile_money_operator_ref_id: operatorRefId,
    };

    const chargeRes = await fetch("https://api.paychangu.com/mobile-money/pay", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYCHANGU_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const chargeData = await chargeRes.json();

    return NextResponse.json(chargeData);
  } catch (err: unknown) {
    return NextResponse.json(
      { status: "failed", "Server error" },
      { status: 500 }
    );
  }
}
