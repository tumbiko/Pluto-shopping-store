// app/lib/sanityOrders.ts
import { client } from "@/sanity/lib/client"; // adjust path if needed
import type { GroupedCartItems, Metadata } from '@/Actions/createCheckOutSession';

/**
 * Create a pending order in Sanity with the provided items & metadata.
 * Returns the created document (Sanity response).
 */
export async function createOrderInSanity(items: GroupedCartItems[], metadata: Metadata) {
  // Build a display name from firstName/lastName (fallback to metadata.customerName)
  const addressFirstName = metadata.address?.firstName ?? '';
  const addressLastName = metadata.address?.lastName ?? '';
  const builtName =
    `${addressFirstName} ${addressLastName}`.trim() ||
    metadata.customerName ||
    '';

  const doc: any = {
    _type: 'order',

    // 🔥 Use charge_id as the REAL order number
    orderNumber: metadata.charge_id,

    clerkUserId: metadata.clerkUserId || null,
    customerName: metadata.customerName || '',
    email: metadata.customerEmail || '',

    products: (items || []).map((it) => ({
      _type: 'object',
      product: { _type: 'reference', _ref: it.product._id },
      quantity: it.quantity,
    })),

    totalPrice: items.reduce(
      (sum, i) =>
        sum + (Number(i.product.price || 0) * (i.quantity || 1)),
      0
    ),

    currency: 'USD', // update if needed
    amountDiscount: 0,

    address: metadata.address
      ? {
          _type: 'object',
          name: builtName,
          address: metadata.address.address || '',
          city: metadata.address.city || '',
          state: metadata.address.state || '',
          zip: metadata.address.zip || '',
          phone: metadata.address.phone ?? '',
          operator: metadata.address.operator ?? '',
        }
      : undefined,

    status: 'pending',
    orderDate: new Date().toISOString(),

    // 🔥 Initialize PayChangu block using charge_id instead of tx_ref
    paychangu: {
      _type: 'object',
      transactionId: '',
      charge_id: metadata.charge_id, // NEW FIELD
      status: 'initialized',
      payment_url: '',
      amount: 0,
      currency: 'USD',
      verified: false,
    },
  };

  // Save to Sanity
  const created = await client.create(doc);
  return created;
}
