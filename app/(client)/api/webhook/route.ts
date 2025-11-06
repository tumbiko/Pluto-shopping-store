// app/api/paychangu/route.ts
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { backendClient } from "@/sanity/lib/backendClient";

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
async function findOrderByNumber(orderNumber: string) {
  try {
    const query = `*[_type == "order" && orderNumber == $orderNumber][0]`;
    return await backendClient.fetch(query, { orderNumber });
  } catch (err) {
    console.error("Error fetching order from sanity:", err);
    return null;
  }
}

// helper: update stock levels if order has products (expects products array with product._ref and quantity)
async function updateStockLevelsFromOrder(order: any) {
  if (!order?.products || !Array.isArray(order.products)) return;
  for (const item of order.products) {
    try {
      const productRef = item?.product?._ref;
      const qty = typeof item.quantity === "number" ? item.quantity : Number(item?.quantity || 0);
      if (!productRef || qty <= 0) continue;

      const product = await backendClient.getDocument(productRef);
      if (!product || typeof product.stock !== "number") {
        console.warn(`Product ${productRef} not found or missing stock.`);
        continue;
      }
      const newStock = Math.max(product.stock - qty, 0);
      await backendClient.patch(productRef).set({ stock: newStock }).commit();
    } catch (err) {
      console.error("Failed to update product stock:", err);
    }
  }
}

// helper: create or patch an order in sanity based on verification data
async function upsertOrderFromVerification(verifyData: any) {
  // paychangu verify response sample: { status, message, data: { tx_ref, reference, amount, currency, charge_id, first_name, last_name, email, customization, ... } }
  const data = verifyData?.data || verifyData;
  const txRef = data?.tx_ref ?? data?.reference; // try both
  const amount = data?.amount ?? null;
  const currency = data?.currency ?? null;
  const chargeId = data?.charge_id ?? data?.charge ?? null;
  const customerName =
    (data?.first_name || data?.last_name)
      ? `${data?.first_name ?? ""} ${data?.last_name ?? ""}`.trim()
      : (data?.customerName ?? null);
  const email = data?.email ?? null;

  if (!txRef) {
    throw new Error("No tx_ref or reference found in verification data");
  }

  const existingOrder = await findOrderByNumber(txRef);

  if (existingOrder) {
    // patch existing order
    const patchData: any = {
      status: "paid",
      paychanguChargeId: chargeId ?? existingOrder.paychanguChargeId ?? null,
      amountFromGateway: amount ?? existingOrder.amountFromGateway ?? null,
      currency: currency ?? existingOrder.currency ?? null,
      paidAt: new Date().toISOString(),
    };

    if (email && !existingOrder.email) patchData.email = email;
    if (customerName && !existingOrder.customerName) patchData.customerName = customerName;

    try {
      await backendClient.patch(existingOrder._id).set(patchData).commit();
    } catch (err) {
      console.error("Error patching existing order:", err);
      throw err;
    }

    // update stock if the order has product items
    await updateStockLevelsFromOrder(existingOrder);

    return { updated: true, orderId: existingOrder._id };
  } else {
    // create minimal order record
    const newOrder: any = {
      _type: "order",
      orderNumber: txRef,
      paychanguChargeId: chargeId ?? null,
      customerName: customerName ?? null,
      email: email ?? null,
      currency: currency ?? null,
      totalPrice: amount ?? null, // NOTE: PayChangu sample `amount` appears to be in units (not necessarily cents) — adjust if you know different.
      status: "paid",
      orderDate: new Date().toISOString(),
      // products: [], // unknown here unless you stored products elsewhere
      verificationRaw: verifyData,
    };

    try {
      const created = await backendClient.create(newOrder);
      return { created: true, orderId: created._id ?? created._id };
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

  // compute HMAC SHA256 of raw payload
  const computed = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

  // Use a timing-safe comparison
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

  // parse payload
  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch (err) {
    console.error("Failed to parse webhook JSON payload:", err);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // expects payload to contain `reference` or `tx_ref` or data containing those
  const txRef = payload?.tx_ref ?? payload?.reference ?? payload?.data?.tx_ref ?? payload?.data?.reference;
  // if the event type indicates a payment or the payload status is success, verify via PayChangu API
  const eventType = payload?.event_type ?? payload?.data?.event_type ?? null;
  const status = payload?.status ?? payload?.data?.status ?? null;

  // If no txRef we cannot verify — bail out
  if (!txRef) {
    console.warn("Webhook payload missing tx_ref/reference. Payload:", payload);
    return NextResponse.json({ error: "Missing tx_ref/reference in payload" }, { status: 400 });
  }

  // call PayChangu verify endpoint (recommended by docs) to confirm
  const secretKey = process.env.PAYCHANGU_SECRET_KEY;
  if (!secretKey) {
    console.error("PAYCHANGU_SECRET_KEY is not set");
    return NextResponse.json({ error: "Missing PayChangu secret key" }, { status: 500 });
  }

  let verifyRespJson: any;
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

    verifyRespJson = await verifyRes.json();
  } catch (err) {
    console.error("Error calling PayChangu verify endpoint:", err);
    return NextResponse.json({ error: "Error verifying transaction" }, { status: 500 });
  }

  // check verification result - standard responses include status: "success" and data.status=== "success"
  const verifyStatus = verifyRespJson?.status ?? verifyRespJson?.data?.status;
  if (!verifyStatus || (typeof verifyStatus === "string" && !verifyStatus.toLowerCase().includes("success"))) {
    console.warn("Transaction verification did not return 'success':", verifyRespJson);
    return NextResponse.json({ error: "Transaction not successful" }, { status: 400 });
  }

  // now upsert order in Sanity
  try {
    const result = await upsertOrderFromVerification(verifyRespJson);
    return NextResponse.json({ received: true, result });
  } catch (err) {
    console.error("Error creating/updating order:", err);
    return NextResponse.json({ error: "Failed to create or update order" }, { status: 500 });
  }
}
