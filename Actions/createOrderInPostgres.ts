"use server";

import prisma from "@/lib/prisma";
import type { Metadata } from "@/Actions/createCheckOutSession";

export interface PostgresCartItem {
  product: {
    _id: string;
    name?: string;
    price?: number;
  };
  quantity: number;
}

/**
 * Persist an order to Neon PostgreSQL via Prisma.
 * Call this from your webhook handler (or after payment confirmation).
 */
export async function createOrderInPostgres(
  items: PostgresCartItem[],
  metadata: Metadata,
  payChanguStatus?: string
) {
  const addressFirstName = metadata.address?.firstName ?? "";
  const addressLastName = metadata.address?.lastName ?? "";
  const builtName =
    `${addressFirstName} ${addressLastName}`.trim() ||
    metadata.customerName ||
    "";

  const totalPrice = items.reduce(
    (sum, i) => sum + Number(i.product.price ?? 0) * (i.quantity ?? 1),
    0
  );

  // Serialise line items to JSON
  const lineItems = items.map((i) => ({
    productId: i.product._id,
    name: i.product.name ?? "",
    quantity: i.quantity,
    price: i.product.price ?? 0,
  }));

  const order = await prisma.order.upsert({
    where: { orderNumber: metadata.orderNumber },
    update: {
      status: payChanguStatus === "successful" ? "paid" : "pending",
      payChanguStatus: payChanguStatus ?? null,
      payChanguVerified: payChanguStatus === "successful",
      updatedAt: new Date(),
    },
    create: {
      orderNumber: metadata.orderNumber,
      clerkUserId: metadata.clerkUserId ?? null,
      customerName: metadata.customerName,
      customerEmail: metadata.customerEmail,
      totalPrice,
      currency: "MWK",
      amountDiscount: 0,
      status: "pending",

      // Shipping address
      addressName: builtName || null,
      addressLine: metadata.address?.address ?? null,
      addressCity: metadata.address?.city ?? null,
      addressState: metadata.address?.state ?? null,
      addressZip: metadata.address?.zip ?? null,
      addressPhone: metadata.address?.phone?.toString() ?? null,
      addressOperator: metadata.address?.operator ?? null,

      // PayChangu
      payChanguChargeId: metadata.charge_id ?? null,
      payChanguStatus: payChanguStatus ?? "initialized",
      payChanguVerified: false,

      // Line items
      items: lineItems,
    },
  });

  return order;
}

/**
 * Update an existing order's payment status (e.g. from a webhook).
 */
export async function updateOrderPaymentStatus(
  orderNumber: string,
  payChanguStatus: string,
  payChanguTransactionId?: string
) {
  return prisma.order.update({
    where: { orderNumber },
    data: {
      status: payChanguStatus === "successful" ? "paid" : payChanguStatus === "failed" ? "failed" : "pending",
      payChanguStatus,
      payChanguTransactionId: payChanguTransactionId ?? null,
      payChanguVerified: payChanguStatus === "successful",
    },
  });
}

/**
 * Fetch a single order by order number.
 */
export async function getOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({ where: { orderNumber } });
}

/**
 * Fetch all orders for a Clerk user.
 */
export async function getOrdersByUser(clerkUserId: string) {
  return prisma.order.findMany({
    where: { clerkUserId },
    orderBy: { createdAt: "desc" },
  });
}
