import prisma from "@/lib/prisma";
import type { GroupedCartItems, Metadata } from "@/Actions/createCheckOutSession";

export async function createOrderInPostgres(items: GroupedCartItems[], metadata: Metadata) {
  try {
    const addressFirstName = metadata.address?.firstName ?? "";
    const addressLastName = metadata.address?.lastName ?? "";
    const builtName = `${addressFirstName} ${addressLastName}`.trim() || metadata.customerName || "";

    const totalPrice = items.reduce(
      (sum, item) => sum + Number(item.product.price || 0) * (item.quantity || 1),
      0
    );

    const orderItems = items.map((item) => ({
      productId: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const order = await prisma.order.create({
      data: {
        orderNumber: metadata.orderNumber,
        clerkUserId: metadata.clerkUserId,
        status: "pending",
        customerName: metadata.customerName,
        customerEmail: metadata.customerEmail,
        totalPrice,
        currency: "MWK",
        amountDiscount: 0,
        addressName: builtName,
        addressLine: metadata.address?.address,
        addressCity: metadata.address?.city,
        addressState: metadata.address?.state,
        addressZip: metadata.address?.zip,
        addressPhone: String(metadata.address?.phone ?? ""),
        addressOperator: metadata.address?.operator,
        items: orderItems,
      },
    });

    console.log("✅ Created order in Postgres:", order.id);
    return order;
  } catch (error) {
    console.error("❌ Failed to create order in Postgres:", error);
    // Don't throw to prevent blocking the checkout flow if Postgres fails but Sanity succeeds
    return null;
  }
}
