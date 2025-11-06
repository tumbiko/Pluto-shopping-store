// app/api/paychangu/route.ts
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { backendClient } from "@/sanity/lib/backendClient";



type OrderProductItem = {
  product?: { _ref?: string } | null;
  quantity?: number | string | null;
  [key: string]: unknown;
};

type OrderDoc = {
  _id?: string;
  products?: OrderProductItem[];
  stock?: number;
  [key: string]: unknown;
};
/**
 * PayChangu webhook route.
 *
 * Requirements (env):
 * - PAYCHANGU_WEBHOOK_SECRET : secret used to compute the HMAC signature sent in the "Signature" header
 * - PAYCHANGU_SECRET_KEY : secret API key used to call the verify-payment endpoint
 *
 * Behavior:
 * 1. Validates HMAC-SHA256 Signature header.
 * 2. Parses payload, extracts reference/tx_ref.
 * 3. Calls PayChangu verify endpoint to confirm transaction status.
 * 4. Finds an existing order in Sanity by orderNumber (tx_ref) and patches it to mark as paid (adds charge id etc).
 * 5. If no order exists, creates a minimal order record.
 * 6. If the existing order has products, reduces product stock (non-negative).
 */

// helper: query Sanity for an order by orderNumber (tx_ref)
async function findOrderByNumber(orderNumber: string): Promise<OrderDoc | null> {
  try {
    const query = `*[_type == "order" && orderNumber == $orderNumber][0]`;
    const res = (await backendClient.fetch(query, { orderNumber })) as unknown;
    return (res as OrderDoc) ?? null;
  } catch (err) {
    console.error("Error fetching order from sanity:", err);
    return null;
  }
}

// helper: update stock levels if order has products (expects products array with product._ref and quantity)
async function updateStockLevelsFromOrder(order: OrderDoc | null) {
  if (!order?.products || !Array.isArray(order.products)) return;
  for (const item of order.products) {
    try {
      const productRef =
        item?.product && typeof item.product === "object"
          ? (item.product as Record<string, unknown>)["_ref"] as string | undefined
          : undefined;

      const qtyRaw = item?.quantity;
      const qty =
        typeof qtyRaw === "number" ? qtyRaw : qtyRaw ? Number(qtyRaw) : 0;

      if (!productRef || qty <= 0) continue;

      const product = (await backendClient.getDocument(productRef)) as unknown;
      const productDoc = product as { stock?: number } | null;
      if (!productDoc || typeof productDoc.stock !== "number") {
        console.warn(`Product ${productRef} not found or missing stock.`);
        continue;
      }
      const newStock = Math.max(productDoc.stock - qty, 0);
      await backendClient.patch(productRef).set({ stock: newStock }).commit();
    } catch (err) {
      console.error("Failed to update product stock:", err);
    }
  }
}
// helper: create or patch an order in sanity based on verification data
async function upsertOrderFromVerification(verifyData: unknown) {
  const asRecord = (val: unknown): Record<string, unknown> =>
    (typeof val === "object" && val !== null) ? (val as Record<string, unknown>) : {};

  const dataRecord = (asRecord(verifyData).data ?? asRecord(verifyData)) as Record<string, unknown>;
  const txRef = (dataRecord["tx_ref"] ?? dataRecord["reference"]) as string | undefined;
  const amount = dataRecord["amount"] as number | string | undefined;
  const currency = dataRecord["currency"] as string | undefined;
  const chargeId = (dataRecord["charge_id"] ?? dataRecord["charge"]) as string | undefined;

  const firstName = dataRecord["first_name"] as string | undefined;
  const lastName = dataRecord["last_name"] as string | undefined;
  const customerName = firstName || lastName ? `${firstName ?? ""} ${lastName ?? ""}`.trim() : (dataRecord["customerName"] as string | undefined);
  const email = dataRecord["email"] as string | undefined;

  if (!txRef) {
    throw new Error("No tx_ref or reference found in verification data");
  }

  const existingOrder = await findOrderByNumber(txRef);

  if (existingOrder) {
    const patchData: Record<string, unknown> = {
      status: "paid",
      paychanguChargeId: chargeId ?? existingOrder["paychanguChargeId"] ?? null,
      amountFromGateway: amount ?? existingOrder["amountFromGateway"] ?? null,
      currency: currency ?? existingOrder["currency"] ?? null,
      paidAt: new Date().toISOString(),
    };

    if (email && !existingOrder["email"]) patchData.email = email;
    if (customerName && !existingOrder["customerName"]) patchData.customerName = customerName;

    try {
      await backendClient.patch(existingOrder._id as string).set(patchData).commit();
    } catch (err) {
      console.error("Error patching existing order:", err);
      throw err;
    }

    await updateStockLevelsFromOrder(existingOrder);

    return { updated: true, orderId: existingOrder._id };
  } else {
    const newOrder: { _type: "order"; [key: string]: unknown } = {
      _type: "order",
      orderNumber: txRef,
      paychanguChargeId: chargeId ?? null,
      customerName: customerName ?? null,
      email: email ?? null,
      currency: currency ?? null,
      totalPrice: amount ?? null,
      status: "paid",
      orderDate: new Date().toISOString(),
      verificationRaw: verifyData,
    };

    try {
      const created = await backendClient.create(newOrder);
      return { created: true, orderId: (created as { _id?: string })._id ?? null };
    } catch (err) {
      console.error("Error creating new order in sanity:", err);
      throw err;
    }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();

  const sig = headersList.get("Signature") ?? headersList.get("signature");
  if (!sig) {
    console.warn("No Signature header found for PayChangu webhook");
    return NextResponse.json({ error: "No Signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("PAYCHANGU_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const computed = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

  const sigBuffer = Buffer.from(sig, "utf8");
  const compBuffer = Buffer.from(computed, "utf8");
  const valid =
    sigBuffer.length === compBuffer.length
      ? crypto.timingSafeEqual(sigBuffer, compBuffer)
      : false;

  if (!valid) {
    console.warn("Invalid PayChangu webhook signature.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as unknown;
  } catch (err) {
    console.error("Failed to parse webhook JSON payload:", err);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const asRecord = (val: unknown): Record<string, unknown> =>
    (typeof val === "object" && val !== null) ? (val as Record<string, unknown>) : {};

  const payloadRec = asRecord(payload);
  const txRef = (payloadRec["tx_ref"] ?? payloadRec["reference"] ?? asRecord(payloadRec["data"])["tx_ref"] ?? asRecord(payloadRec["data"])["reference"]) as string | undefined;

  if (!txRef) {
    console.warn("Webhook payload missing tx_ref/reference. Payload:", payload);
    return NextResponse.json({ error: "Missing tx_ref/reference in payload" }, { status: 400 });
  }

  const secretKey = process.env.PAYCHANGU_SECRET_KEY;
  if (!secretKey) {
    console.error("PAYCHANGU_SECRET_KEY is not set");
    return NextResponse.json({ error: "Missing PayChangu secret key" }, { status: 500 });
  }

  let verifyRespJson: unknown;
  try {
    const verifyRes = await fetch(`https://api.paychangu.com/verify-payment/${encodeURIComponent(txRef)}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (!verifyRes.ok) {
      const text = await verifyRes.text();
      console.error("PayChangu verify endpoint returned non-OK:", verifyRes.status, text);
      return NextResponse.json({ error: "Failed to verify transaction with PayChangu" }, { status: 500 });
    }

    verifyRespJson = await verifyRes.json() as unknown;
  } catch (err) {
    console.error("Error calling PayChangu verify endpoint:", err);
    return NextResponse.json({ error: "Error verifying transaction" }, { status: 500 });
  }

  const verifyRec = asRecord(verifyRespJson);
  const verifyStatus = (verifyRec["status"] ?? asRecord(verifyRec["data"])["status"]) as string | undefined;
  if (!verifyStatus || !verifyStatus.toLowerCase().includes("success")) {
    console.warn("Transaction verification did not return 'success':", verifyRespJson);
    return NextResponse.json({ error: "Transaction not successful" }, { status: 400 });
  }

  try {
    const result = await upsertOrderFromVerification(verifyRespJson);
    return NextResponse.json({ received: true, result });
  } catch (err) {
    console.error("Error creating/updating order:", err);
    return NextResponse.json({ error: "Failed to create or update order" }, { status: 500 });
  }
}
