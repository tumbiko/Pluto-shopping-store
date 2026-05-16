import { BasketIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export const orderType = defineType({
  name: "order",
  title: "Order",
  type: "document",
  icon: BasketIcon,
  fields: [
    defineField({
      name: "orderNumber",
      title: "Order Number",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    // Optional invoice
    defineField({
      name: "invoice",
      title: "Invoice (optional)",
      type: "object",
      fields: [
        { name: "id", type: "string" },
        { name: "number", type: "string" },
        { name: "hosted_invoice_url", type: "url" },
      ],
    }),

    // PayChangu payment data
    defineField({
      name: "paychangu",
      title: "PayChangu Data",
      type: "object",
      fields: [
        defineField({
          name: "transactionId",
          title: "Transaction ID",
          description: "PayChangu internal transaction identifier (may be null)",
          type: "string",
        }),

        defineField({
          name: "charge_id",
          title: "Charge ID",
          description: "The ID returned by PayChangu verify API (use as the main order number)",
          type: "string",
        }),

        defineField({
          name: "status",
          title: "Payment Status",
          type: "string",
          options: {
            list: [
              { title: "Initialized", value: "initialized" },
              { title: "Pending", value: "pending" },
              { title: "Success", value: "success" },
              { title: "Failed", value: "failed" },
              { title: "Canceled", value: "canceled" },
            ],
          },
        }),

        defineField({
          name: "payment_url",
          title: "Hosted Payment URL",
          type: "url",
        }),

        defineField({
          name: "amount",
          title: "Amount (as sent to PayChangu)",
          type: "number",
        }),

        defineField({
          name: "currency",
          title: "Currency",
          type: "string",
        }),

        defineField({
          name: "verified",
          title: "Webhook Verified",
          description:
            "Set true after webhook signature + verify endpoint confirms payment",
          type: "boolean",
          initialValue: false,
        }),

        defineField({
          name: "paidAt",
          title: "Paid At",
          type: "datetime",
        }),

        defineField({
          name: "rawResponse",
          title: "Raw PayChangu Response",
          description:
            "Full API response for auditing / debugging",
          type: "object",
          options: { collapsible: true, collapsed: true },
          fields: [
            { name: "body", title: "Response body", type: "text" },
          ],
        }),
      ],
      options: { collapsible: true, collapsed: false },
    }),

    // --- Customer and order fields remain unchanged ---
    defineField({
      name: "clerkUserId",
      title: "Store User ID",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "customerName",
      title: "Customer Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "email",
      title: "Customer Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    }),

    defineField({
      name: "products",
      title: "Products",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "product",
              title: "Product Bought",
              type: "reference",
              to: [{ type: "product" }],
            }),
            defineField({
              name: "quantity",
              title: "Quantity Purchased",
              type: "number",
            }),
          ],
          preview: {
            select: {
              productTitle: "product.name",
              quantity: "quantity",
              image: "product.images.0",
              price: "product.price",
              currency: "product.currency",
            },
            prepare(select) {
              const title = select.productTitle || "Product";
              const qty = select.quantity || 0;
              const price =
                typeof select.price === "number" ? select.price : 0;
              return {
                title: `${title} x ${qty}`,
                subtitle: `${price * qty} ${select.currency || ""}`,
                media: select.image,
              };
            },
          },
        }),
      ],
    }),

    defineField({
      name: "totalPrice",
      title: "Total Price",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),

    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "amountDiscount",
      title: "Amount Discount",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "address",
      title: "Shipping Address",
      type: "object",
      fields: [
        defineField({ name: "state", title: "State", type: "string" }),
        defineField({ name: "zip", title: "Zip Code", type: "string" }),
        defineField({ name: "city", title: "City", type: "string" }),
        defineField({ name: "address", title: "Address", type: "string" }),
        defineField({ name: "name", title: "Name", type: "string" }),
      ],
    }),

    defineField({
      name: "status",
      title: "Order Status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Processing", value: "processing" },
          { title: "Paid", value: "paid" },
          { title: "Shipped", value: "shipped" },
          { title: "Out for Delivery", value: "out_for_delivery" },
          { title: "Delivered", value: "delivered" },
          { title: "Cancelled", value: "cancelled" },
        ],
      },
      initialValue: "pending",
    }),

    defineField({
      name: "orderDate",
      title: "Order Date",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      name: "customerName",
      amount: "totalPrice",
      currency: "currency",
      orderId: "orderNumber",
      email: "email",
      status: "status",
    },
    prepare(select) {
      const id = select.orderId || "";
      const shortId = id ? `${id.slice(0, 5)}...${id.slice(-5)}` : "(no id)";
      const amount =
        typeof select.amount === "number" ? select.amount : 0;

      const subtitleParts = [`${amount} ${select.currency || ""}`];
      if (select.email) subtitleParts.push(select.email);
      if (select.status) subtitleParts.push(select.status);

      return {
        title: `${select.name || "Customer"} (${shortId})`,
        subtitle: subtitleParts.join(" • "),
        media: BasketIcon,
      };
    },
  },
});
