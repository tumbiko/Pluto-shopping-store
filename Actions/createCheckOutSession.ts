'use server';

import { Address } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import { CartItem } from "@/store";

export interface Metadata {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  clerkUserId?: string;
  address?: Address | null;
}

export interface GroupedCartItems {
  product: CartItem["product"];
  quantity: number;
}

function splitName(fullName: string | undefined | null): { first: string; last: string } {
  const name = (fullName || "").trim();
  if (!name) return { first: "", last: "" };
  const parts = name.split(/\s+/);
  return {
    first: parts[0] || "",
    last: parts.slice(1).join(" ") || "",
  };
}

/**
 * Create a PayChangu standard checkout session (hosted checkout).
 * Returns the PayChangu checkout URL (string) to redirect the customer to.
 */
export async function createPayChanguCheckoutSession(
  items: GroupedCartItems[],
  metadata: Metadata
): Promise<string> {
  const secretKey = process.env.PAYCHANGU_SECRET_KEY;
  const callbackUrl = process.env.PAYCHANGU_CALLBACK_URL; // IPN / webhook URL (required by PayChangu docs)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!secretKey) throw new Error("Missing PAYCHANGU_SECRET_KEY env var");
  if (!callbackUrl) throw new Error("Missing PAYCHANGU_CALLBACK_URL env var");
  if (!baseUrl) throw new Error("Missing NEXT_PUBLIC_BASE_URL env var");

  // Use MWK by default (PayChangu expects 'MWK' or 'USD')
  const currency = (process.env.PAYCHANGU_CURRENCY ?? "MWK").toUpperCase();

  // total amount as integer (PayChangu expects int32)
  const amountInt = Math.round(
    items.reduce((s, i) => s + Number(i.product.price || 0) * (i.quantity || 0), 0)
  );

  const products = items.map((it) => ({
    id: it.product._id,
    name: it.product.name,
    quantity: it.quantity,
    price: it.product.price,
    image: it.product.images?.length ? urlFor(it.product.images[0]).url() : undefined,
  }));

  // Build payer name preferring address first/last if available
  const addrFirst = metadata.address?.firstName?.trim();
  const addrLast = metadata.address?.lastName?.trim();
  const payer = (addrFirst || addrLast)
    ? { first: addrFirst || "", last: addrLast || "" }
    : splitName(metadata.customerName);

  // Build a small, safe address object for meta (avoid sending whole Sanity doc)
  const metaAddress = metadata.address
    ? {
        firstName: metadata.address.firstName ?? "",
        lastName: metadata.address.lastName ?? "",
        address: metadata.address.address ?? "",
        city: metadata.address.city ?? "",
        state: metadata.address.state ?? "",
        zip: metadata.address.zip ?? "",
        phone: metadata.address.phone ?? "",
        operator: metadata.address.operator ?? "",
      }
    : undefined;

  const payload: Record<string, any> = {
    amount: amountInt,
    currency, // 'MWK' or 'USD'
    callback_url: callbackUrl, // PayChangu expects callback_url (IPN)
    // return_url is used for redirect after cancel/failed in docs; we use it for success redirect here
    // PayChangu's docs show return_url (return after cancel/failed). Many examples also use it for redirects.
    // We include return_url to ensure PayChangu can redirect the customer back.
    return_url: `${baseUrl}/success?orderNumber=${encodeURIComponent(metadata.orderNumber)}&tx_ref=${encodeURIComponent(metadata.orderNumber)}`,
    tx_ref: metadata.orderNumber, // must be unique for every transaction
    first_name: payer.first,
    last_name: payer.last,
    email: metadata.customerEmail,
    customization: {
      title: `Order ${metadata.orderNumber}`,
      description: `Payment for order ${metadata.orderNumber}`,
    },
    // minimal meta (optional) — keep it small to avoid validation issues
    meta: {
      orderNumber: metadata.orderNumber,
      clerkUserId: metadata.clerkUserId ?? null,
      address: metaAddress ?? null,
      products,
    },
  };

  // NOTE: If you prefer to remove meta entirely (to rule out validation issues), delete the `meta` field above.

  const res = await fetch("https://api.paychangu.com/mobile-money/payments/initialize", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("PayChangu create payment error:", res.status, text);
    // include response body in error for easier debugging in server logs
    throw new Error(`PayChangu responded with ${res.status}: ${text}`);
  }

  const data = await res.json();

  // PayChangu docs example returns checkout_url at data.checkout_url (or data.data.checkout_url)
  const paymentUrl =
    data?.data?.checkout_url ||
    data?.data?.payment_url ||
    data?.checkout_url ||
    data?.payment_url ||
    data?.data?.redirect_url ||
    data?.redirect_url;

  if (!paymentUrl) {
    console.error("Unexpected PayChangu response:", JSON.stringify(data, null, 2));
    throw new Error("Missing payment redirect URL in PayChangu response");
  }

  return paymentUrl;
}
