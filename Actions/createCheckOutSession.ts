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

export async function createPayChanguCheckoutSession(
  items: GroupedCartItems[],
  metadata: Metadata
): Promise<string> {
  const secretKey = process.env.PAYCHANGU_SECRET_KEY;
  const callbackUrl = process.env.PAYCHANGU_CALLBACK_URL;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!secretKey) throw new Error("Missing PAYCHANGU_SECRET_KEY env var");
  if (!callbackUrl) throw new Error("Missing PAYCHANGU_CALLBACK_URL env var");
  if (!baseUrl) throw new Error("Missing NEXT_PUBLIC_BASE_URL env var");

  // Prefer MWK as the currency code
  const currency = process.env.PAYCHANGU_CURRENCY ?? "MWK";

  const amount =
    currency === "MWK"
      ? Math.round(items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0))
      : items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

  const products = items.map((it) => ({
    id: it.product._id,
    name: it.product.name,
    quantity: it.quantity,
    price: it.product.price,
    image: it.product.images?.length ? urlFor(it.product.images[0]).url() : undefined,
  }));

  // Determine payer first/last name: prefer address firstName/lastName, otherwise fallback to customerName
  const addrFirst = metadata.address?.firstName?.trim();
  const addrLast = metadata.address?.lastName?.trim();
  const nameFromAddress = (addrFirst || addrLast) ? { first: addrFirst || "", last: addrLast || "" } : null;
  const fallback = splitName(metadata.customerName);
  const payer = nameFromAddress ?? fallback;

  const payload = {
    amount,
    currency,
    callback_url: callbackUrl,
    success_url: `${baseUrl}/success?orderNumber=${encodeURIComponent(
      metadata.orderNumber
    )}&tx_ref=${encodeURIComponent(metadata.orderNumber)}`,
    cancel_url: `${baseUrl}/cart`,
    tx_ref: metadata.orderNumber,
    first_name: payer.first,
    last_name: payer.last,
    email: metadata.customerEmail,
    customization: {
      title: `Order ${metadata.orderNumber}`,
      description: `Payment for order ${metadata.orderNumber}`,
    },
    meta: {
      orderNumber: metadata.orderNumber,
      clerkUserId: metadata.clerkUserId,
      address: metadata.address,
      products,
    },
  };

  const res = await fetch("https://api.paychangu.com/payment", {
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
    throw new Error(`PayChangu responded with ${res.status}`);
  }

  const data = await res.json();
  const paymentUrl =
    data?.data?.payment_url ||
    data?.data?.redirect_url ||
    data?.payment_url ||
    data?.redirect_url;

  if (!paymentUrl) {
    console.error("Unexpected PayChangu response:", JSON.stringify(data, null, 2));
    throw new Error("Missing payment redirect URL");
  }

  return paymentUrl;
}
