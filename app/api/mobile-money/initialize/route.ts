import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const payload = {
      mobile: body.phone,
      amount: String(body.amount),
      charge_id: crypto.randomUUID(),
      mobile_money_operator_ref_id: "20be6c20-adeb-4b5b-a7ba-0769820df4fb",
      email: body.email,
      first_name: body.firstName,
      last_name: body.lastName,
    };

    const res = await fetch("https://api.paychangu.com/mobile-money/payments/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
