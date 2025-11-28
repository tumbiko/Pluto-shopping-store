// app/api/webhook/route.ts
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { backendClient } from "@/sanity/lib/backendClient";
import { createOrderInSanity as createOrderInSanityImported } from "@/Actions/CreateOrderInSanity";

type OrderProductItem = {
  product?: { _ref?: string } | null;
  quantity?: number | string | null;
  [key: string]: unknown;
};

type OrderDoc = {
  _id?: string;
  orderNumber?: string;
  products?: OrderProductItem[];
  email?: string;
  customerName?: string;
  [key: string]: unknown;
};

const LOG_PREFIX = "[paychangu-webhook]";

/**
 * Small helper: ensure value is a non-null object; return typed Record for safe property access.
 */
function asRecord(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
}

/**
 * Types for raw incoming item shapes we try to normalize.
 */
type RawItem = Record<string, unknown>;
type NormalizedItem = { product: string; quantity: number };

/**
 * Types used for createOrderInSanity wrapper
 */
type GroupedCartItem = {
  product: { _id: string };
  quantity: number;
};

type CreateOrderMeta = {
  charge_id: string;
  clerkUserId?: string | null;
  customerName?: string | undefined;
  customerEmail?: string | undefined;
  address?: Record<string, unknown> | undefined;
};

/**
 * createOrderInSanityImported may or may not be typed in your codebase.
 * Create a small typed wrapper so the rest of this file can call it with typed inputs.
 */
const createOrderInSanity = (createOrderInSanityImported as unknown) as (
  items: GroupedCartItem[],
  meta: CreateOrderMeta
) => Promise<{ _id?: string }>;

async function findOrderByNumber(orderNumber: string): Promise<OrderDoc | null> {
  try {
    console.log(`${LOG_PREFIX} [findOrderByNumber] Querying orderNumber=${orderNumber}`);
    const query = `*[_type == "order" && orderNumber == $orderNumber][0]`;
    const resUnknown = await backendClient.fetch(query, { orderNumber });
    return (resUnknown as OrderDoc) ?? null;
  } catch (err) {
    console.error(`${LOG_PREFIX} [findOrderByNumber] Error fetching order from sanity:`, err);
    return null;
  }
}

async function updateStockLevelsFromOrder(order: OrderDoc | null) {
  if (!order || !Array.isArray(order.products)) {
    console.log(
      `${LOG_PREFIX} [updateStockLevelsFromOrder] No products to update for order:`,
      order?._id ?? "(no id)"
    );
    return;
  }

  console.log(
    `${LOG_PREFIX} [updateStockLevelsFromOrder] Updating stocks for order ${order._id} with ${order.products.length} items`
  );

  for (const item of order.products) {
    try {
      const productRef =
        item?.product && typeof item.product === "object"
          ? (item.product as Record<string, unknown>)["_ref"] as string | undefined
          : undefined;

      const qtyRaw = item?.quantity;
      const qty = typeof qtyRaw === "number" ? qtyRaw : qtyRaw ? Number(qtyRaw) : 0;

      if (!productRef) {
        console.warn(
          `${LOG_PREFIX} [updateStockLevelsFromOrder] Missing product ref on item, skipping:`,
          item
        );
        continue;
      }
      if (qty <= 0) {
        console.warn(
          `${LOG_PREFIX} [updateStockLevelsFromOrder] Non-positive qty (${qty}) for ${productRef}, skipping`
        );
        continue;
      }

      console.log(`${LOG_PREFIX} [updateStockLevelsFromOrder] Fetching product ${productRef} (qty ${qty})`);
      const productDoc = (await backendClient.getDocument(productRef)) as { stock?: number } | null;

      if (!productDoc) {
        console.warn(`${LOG_PREFIX} [updateStockLevelsFromOrder] Product ${productRef} not found`);
        continue;
      }
      if (typeof productDoc.stock !== "number") {
        console.warn(
          `${LOG_PREFIX} [updateStockLevelsFromOrder] Product ${productRef} missing numeric stock, skipping`
        );
        continue;
      }

      const oldStock = productDoc.stock;
      const newStock = Math.max(oldStock - qty, 0);
      console.log(
        `${LOG_PREFIX} [updateStockLevelsFromOrder] Updating product ${productRef} stock ${oldStock} -> ${newStock}`
      );
      await backendClient.patch(productRef).set({ stock: newStock }).commit();
      console.log(`${LOG_PREFIX} [updateStockLevelsFromOrder] Stock updated for ${productRef}`);
    } catch (err) {
      console.error(`${LOG_PREFIX} [updateStockLevelsFromOrder] Failed to update product stock:`, err);
    }
  }
}

/**
 * Normalize items found in verification payload/metadata
 *
 * Ensures items are returned as a non-nullable array of { product: string, quantity: number }
 */
function extractItemsAndMetadataFromVerify(verifyData: unknown): {
  items?: NormalizedItem[];
  metadata?: Record<string, unknown>;
} {
  const rec = asRecord(verifyData);
  const data = asRecord(rec.data ?? rec);
  const metadata = asRecord(data.metadata ?? rec.metadata ?? {});

  // prefer multiple possible locations for items
  const dataOrder = asRecord(data.order ?? {});
  const candidateItems =
    (Array.isArray(data.items) && data.items) ||
    (Array.isArray(data.products) && data.products) ||
    (Array.isArray(dataOrder.products) && dataOrder.products) ||
    (Array.isArray(metadata.items) && metadata.items) ||
    [];

  const rawItems = candidateItems as RawItem[];

  const mapped = rawItems
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      const productId =
        (it["productId"] as string | undefined) ??
        (it["product_id"] as string | undefined) ??
        (asRecord(it.product)["_id"] as string | undefined) ??
        (asRecord(it.product)["_ref"] as string | undefined) ??
        (it["productRef"] as string | undefined) ??
        (it["sku"] as string | undefined) ??
        (it["id"] as string | undefined);

      const qtyRaw = it["quantity"] ?? it["qty"] ?? it["count"] ?? it["amount"] ?? 0;
      const qty = typeof qtyRaw === "number" ? qtyRaw : Number(qtyRaw ?? 0);
      if (!productId) return null;
      return { product: String(productId), quantity: Number(qty) || 0 } as NormalizedItem;
    })
    .filter((v): v is NormalizedItem => v !== null && typeof v === "object");

  return { items: mapped.length ? mapped : undefined, metadata };
}

/**
 * Upsert order in Sanity using `charge_id` as orderNumber (the canonical key)
 */
async function upsertOrderFromVerification(verifyData: unknown) {
  const rec = asRecord(verifyData);
  const data = asRecord(rec.data ?? rec);

  // Extract tx_ref (original orderNumber) to find the order in Sanity
  const txRef =
    (data["tx_ref"] as string | undefined) ??
    (data["reference"] as string | undefined) ??
    (rec["tx_ref"] as string | undefined) ??
    (rec["reference"] as string | undefined);

  // Extract charge_id (PayChangu's transaction ID)
  const chargeId =
    (data["id"] as string | undefined) ??
    (data["charge_id"] as string | undefined) ??
    (rec["id"] as string | undefined) ??
    (rec["charge_id"] as string | undefined);

  const amount = data["amount"] ?? rec["amount"];
  const currency = (data["currency"] ?? rec["currency"]) as string | undefined;
  const firstName = (data["first_name"] ?? rec["first_name"]) as string | undefined;
  const lastName = (data["last_name"] ?? rec["last_name"]) as string | undefined;
  const email = (data["email"] ?? rec["email"]) as string | undefined;
  const customerName =
    (firstName || lastName)
      ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
      : ((data["customerName"] ?? rec["customerName"]) as string | undefined);

  if (!txRef || !chargeId) {
    console.error(`${LOG_PREFIX} [upsertOrderFromVerification] Missing tx_ref or charge_id. txRef=${txRef}, chargeId=${chargeId}`);
    throw new Error("Missing tx_ref or charge_id in verification payload");
  }

  console.log(`${LOG_PREFIX} [upsertOrderFromVerification] Handling txRef=${txRef}, chargeId=${chargeId}`);

  // Look for existing order by orderNumber (which matches tx_ref)
  const existingOrder = await findOrderByNumber(txRef);

  // Build paychangu object
  const rawBodyString = (() => {
    try {
      return JSON.stringify(verifyData);
    } catch {
      return String(verifyData);
    }
  })();

  const paychanguObj: Record<string, unknown> = {
    transactionId: chargeId,
    charge_id: chargeId,
    status: "success",
    amount: typeof amount === "number" ? amount : Number(amount ?? 0),
    currency: currency ?? null,
    verified: true,
    paidAt: new Date().toISOString(),
    rawResponse: { body: rawBodyString },
  };

  if (existingOrder) {
    console.log(
      `${LOG_PREFIX} [upsertOrderFromVerification] Existing order found: ${existingOrder._id}. Patching...`
    );
    const patchData: Record<string, unknown> = {
      status: "paid",
      paychangu: paychanguObj,
      paidAt: new Date().toISOString(),
    };
    if (email && !existingOrder.email) patchData.email = email;
    if (customerName && !existingOrder.customerName) patchData.customerName = customerName;

    try {
      await backendClient.patch(existingOrder._id as string).set(patchData).commit();
      console.log(`${LOG_PREFIX} [upsertOrderFromVerification] Patched order ${existingOrder._id} successfully.`);
    } catch (err) {
      console.error(`${LOG_PREFIX} [upsertOrderFromVerification] Error patching existing order:`, err);
      throw err;
    }

    // update stock - guard the products access
    try {
      const orderForStock: OrderDoc = {
        _id: existingOrder._id,
        products: Array.isArray(existingOrder.products) ? existingOrder.products : [],
      };
      await updateStockLevelsFromOrder(orderForStock);
      console.log(
        `${LOG_PREFIX} [upsertOrderFromVerification] Stock update completed for existing order ${existingOrder._id}.`
      );
    } catch (err) {
      console.error(
        `${LOG_PREFIX} [upsertOrderFromVerification] Error updating stock levels for existing order:`,
        err
      );
    }

    return { updated: true, orderId: existingOrder._id };
  } else {
    console.log(`${LOG_PREFIX} [upsertOrderFromVerification] No existing order for ${chargeId}. Creating new order.`);

    const { items, metadata } = extractItemsAndMetadataFromVerify(verifyData);
    console.log(`${LOG_PREFIX} [upsertOrderFromVerification] Extracted items? ${Boolean(items && items.length)}`);

    try {
      if (items && items.length) {
        // Prepare shape expected by createOrderInSanity (GroupedCartItems[])
        const groupedItems: GroupedCartItem[] = items.map((it) => ({
          product: { _id: it.product },
          quantity: it.quantity || 1,
        }));

        const createMeta: CreateOrderMeta = {
          charge_id: chargeId,
          clerkUserId: (metadata?.clerkUserId as string | undefined) ?? null,
          customerName: (customerName as string | undefined) ?? (metadata?.customerName as string | undefined) ?? undefined,
          customerEmail: (email as string | undefined) ?? (metadata?.customerEmail as string | undefined) ?? undefined,
          address: (metadata?.address as Record<string, unknown> | undefined) ?? undefined,
        };

        console.log(`${LOG_PREFIX} [upsertOrderFromVerification] Creating order in Sanity with items.`, {
          groupedItems,
          createMeta,
        });

        const created = await createOrderInSanity(groupedItems, createMeta);
        const createdId = created._id;
        console.log(`${LOG_PREFIX} [upsertOrderFromVerification] Created order in Sanity:`, createdId);

        // update stock based on created doc
        try {
          if (createdId) {
            const createdDocRaw = await backendClient.fetch(`*[_type == "order" && _id == $id][0]`, { id: createdId });
            const createdDoc = createdDocRaw as OrderDoc;
            if (Array.isArray(createdDoc.products) && createdDoc.products.length) {
              await updateStockLevelsFromOrder(createdDoc);
            } else {
              console.log(`${LOG_PREFIX} [upsertOrderFromVerification] Created order has no products for stock update.`);
            }
            console.log(`${LOG_PREFIX} [upsertOrderFromVerification] Stock update attempted for created order ${createdId}.`);
          } else {
            console.warn(`${LOG_PREFIX} [upsertOrderFromVerification] Created order returned no _id, skipping stock update.`);
          }
        } catch (err) {
          console.error(`${LOG_PREFIX} [upsertOrderFromVerification] Error updating stock after created order:`, err);
        }

        // patch paychangu object on created order
        try {
          if (createdId) {
            await backendClient.patch(createdId).set({ paychangu: paychanguObj, status: "paid" }).commit();
            console.log(`${LOG_PREFIX} [upsertOrderFromVerification] Patched paychangu data on created order ${createdId}.`);
          } else {
            console.warn(`${LOG_PREFIX} [upsertOrderFromVerification] No createdId found to patch paychangu.`);
          }
        } catch (err) {
          console.error(`${LOG_PREFIX} [upsertOrderFromVerification] Error patching paychangu on created order:`, err);
        }

        return { created: true, orderId: createdId ?? null };
      } else {
        // fallback: minimal order
        const newOrder: { _type: "order"; [key: string]: unknown } = {
          _type: "order",
          orderNumber: chargeId,
          customerName: customerName ?? null,
          email: email ?? null,
          currency: currency ?? null,
          totalPrice: typeof amount === "number" ? amount : Number(amount ?? 0),
          status: "paid",
          orderDate: new Date().toISOString(),
          paychangu: paychanguObj,
          verificationRaw: verifyData,
        };

        console.log(`${LOG_PREFIX} [upsertOrderFromVerification] Creating minimal order (no items).`);
        const created = await backendClient.create(newOrder);
        console.log(`${LOG_PREFIX} [upsertOrderFromVerification] Created minimal order:`, (created as { _id?: string })._id);
        return { created: true, orderId: (created as { _id?: string })._id ?? null };
      }
    } catch (err) {
      console.error(`${LOG_PREFIX} [upsertOrderFromVerification] Error creating new order in sanity:`, err);
      throw err;
    }
  }
}

export async function POST(req: NextRequest) {
  console.log(`${LOG_PREFIX} [POST] Incoming webhook invoked`);
  const rawBody = await req.text();
  const headersList = await headers();

  // Log a small body preview (avoid logging huge payloads)
  const bodyPreview = rawBody.length > 200 ? `${rawBody.slice(0, 200)}...` : rawBody;
  console.log(`${LOG_PREFIX} [POST] Raw body preview: ${bodyPreview}`);

  const sig = headersList.get("Signature") ?? headersList.get("signature");
  console.log(`${LOG_PREFIX} [POST] Signature header present? ${Boolean(sig)}`);

  // If a webhook signature secret exists, try to verify it. If missing, allow unsigned internal calls.
  const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
  console.log(`${LOG_PREFIX} [POST] PAYCHANGU_WEBHOOK_SECRET configured? ${Boolean(webhookSecret)}`);

  if (sig && !webhookSecret) {
    console.warn(`${LOG_PREFIX} Received signature header but PAYCHANGU_WEBHOOK_SECRET is not configured. Proceeding but this is insecure.`);
  }

  if (sig && webhookSecret) {
    try {
      const computed = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
      const sigBuffer = Buffer.from(sig, "utf8");
      const compBuffer = Buffer.from(computed, "utf8");
      const valid = sigBuffer.length === compBuffer.length ? crypto.timingSafeEqual(sigBuffer, compBuffer) : false;
      if (!valid) {
        console.warn(`${LOG_PREFIX} Invalid PayChangu webhook signature.`);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
      console.log(`${LOG_PREFIX} Signature valid.`);
    } catch (err) {
      console.error(`${LOG_PREFIX} Signature verification failed:`, err);
      return NextResponse.json({ error: "Signature verification error" }, { status: 400 });
    }
  } else {
    console.warn(`${LOG_PREFIX} No signature provided. Allowing request (expected for internal verify calls).`);
  }

  // parse JSON body (support both { order: data } posted by your verify endpoint and raw webhook bodies)
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
    console.log(`${LOG_PREFIX} [POST] Parsed JSON payload (keys):`, Object.keys(asRecord(payload)));
  } catch (err) {
    console.error(`${LOG_PREFIX} Failed to parse JSON body:`, err);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const bodyRec = asRecord(payload);

  // Determine verification object (prefer body.order if present)
  const verifyObj = (bodyRec["order"] ?? bodyRec["data"] ?? bodyRec) as unknown;
  console.log(`${LOG_PREFIX} Received payload for processing (hasOrderField=${!!bodyRec["order"]})`);

  // We expect charge id in verifyObj.data.id or verifyObj.id or verifyObj.charge_id
  const vRec = asRecord(verifyObj);
  const dataRec = asRecord(vRec.data ?? vRec);

  const chargeId = (dataRec["id"] ?? dataRec["charge_id"] ?? vRec["id"] ?? vRec["charge_id"]) as string | undefined;
  console.log(`${LOG_PREFIX} Extracted chargeId: ${chargeId}`);

  if (!chargeId) {
    console.warn(`${LOG_PREFIX} Payload missing charge_id/id. Payload:`, verifyObj);
    return NextResponse.json({ error: "Missing charge_id/id in payload" }, { status: 400 });
  }

  // Optional: re-verify the transaction server-side with the secret key (defensive)
  const secretKey = process.env.PAYCHANGU_SECRET_KEY;
  console.log(`${LOG_PREFIX} PAYCHANGU_SECRET_KEY configured? ${Boolean(secretKey)}`);
  if (!secretKey) {
    console.warn(`${LOG_PREFIX} PAYCHANGU_SECRET_KEY not set. Skipping server-side verification.`);
  } else {
    try {
      const verifyUrl = `https://api.paychangu.com/mobile-money/payments/${encodeURIComponent(chargeId)}/verify`;
      console.log(`${LOG_PREFIX} Calling PayChangu verify endpoint for chargeId:`, chargeId);
      const verifyRes = await fetch(verifyUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${secretKey}`,
        },
      });
      if (!verifyRes.ok) {
        const text = await verifyRes.text();
        console.error(`${LOG_PREFIX} PayChangu verify endpoint returned non-OK:`, verifyRes.status, text);
        return NextResponse.json({ error: "Failed to verify transaction with PayChangu" }, { status: 500 });
      }
      const verifyJson = await verifyRes.json();
      console.log(`${LOG_PREFIX} PayChangu verify response (keys):`, Object.keys(asRecord(verifyJson)));

      // Ensure verify response indicates success
      const verifyRec = asRecord(verifyJson);
      const verifyStatus = (verifyRec["status"] ?? asRecord(verifyRec["data"])["status"]) as string | undefined;
      console.log(`${LOG_PREFIX} PayChangu verify status: ${verifyStatus}`);
      if (!verifyStatus || !verifyStatus.toLowerCase().includes("success")) {
        console.warn(`${LOG_PREFIX} Transaction verification not successful:`, verifyJson);
        return NextResponse.json({ error: "Transaction not successful" }, { status: 400 });
      }

      // Use the verify JSON as the canonical verification payload we pass to upsert
      try {
        const result = await upsertOrderFromVerification(verifyJson);
        console.log(`${LOG_PREFIX} Upsert result:`, result);
        return NextResponse.json({ received: true, result });
      } catch (err) {
        console.error(`${LOG_PREFIX} Error creating/updating order from verify json:`, err);
        return NextResponse.json({ error: "Failed to create or update order" }, { status: 500 });
      }
    } catch (err) {
      console.error(`${LOG_PREFIX} Error calling PayChangu verify endpoint:`, err);
      return NextResponse.json({ error: "Error verifying transaction" }, { status: 500 });
    }
  }

  // If we couldn't/decided not to call PayChangu verify endpoint (no secret key), proceed with the provided payload
  try {
    console.log(`${LOG_PREFIX} Proceeding with provided payload without external verify.`);
    const result = await upsertOrderFromVerification(verifyObj);
    console.log(`${LOG_PREFIX} Upsert result (without external verify):`, result);
    return NextResponse.json({ received: true, result });
  } catch (err) {
    console.error(`${LOG_PREFIX} Error creating/updating order:`, err);
    return NextResponse.json({ error: "Failed to create or update order" }, { status: 500 });
  }
}
