// app/lib/sanityOrders.ts
import { client } from "@/sanity/lib/client" // adjust path if needed
import type { GroupedCartItems, Metadata } from '@/Actions/createCheckOutSession';

/**
 * Create a pending order in Sanity with the provided items & metadata.
 * Returns the created document (Sanity response).
 */
export async function createOrderInSanity(items: GroupedCartItems[], metadata: Metadata) {
  // Build a display name from firstName/lastName if provided (fallback to metadata.customerName)
  const addressFirstName = metadata.address?.firstName ?? '';
  const addressLastName = metadata.address?.lastName ?? '';
  const builtName = `${addressFirstName} ${addressLastName}`.trim() || metadata.customerName || '';

  const doc: any = {
    _type: 'order',
    orderNumber: metadata.orderNumber,
    clerkUserId: metadata.clerkUserId || null,
    customerName: metadata.customerName || '',
    email: metadata.customerEmail || '',
    products: (items || []).map((it) => ({
      _type: 'object',
      product: { _type: 'reference', _ref: it.product._id },
      quantity: it.quantity,
    })),
    totalPrice: items.reduce((sum, i) => sum + (Number(i.product.price || 0) * (i.quantity || 1)), 0),
    currency: 'USD', // change if you pass currency in metadata
    amountDiscount: 0,
    address: metadata.address ? {
      _type: 'object',
      // Compose the name from firstName + lastName (safe if they don't exist)
      name: builtName,
      // keep the original address fields
      address: metadata.address.address || '',
      city: metadata.address.city || '',
      state: metadata.address.state || '',
      zip: metadata.address.zip || '',
      // optionally include phone/operator if you want to record them
      phone: metadata.address.phone ?? '',
      operator: metadata.address.operator ?? '',
    } : undefined,
    status: 'pending',
    orderDate: new Date().toISOString(),
    // init empty paychangu object so updates can patch into it
    paychangu: {
      _type: 'object',
      transactionId: '',
      tx_ref: metadata.orderNumber,
      status: 'initialized',
      payment_url: '',
      amount: 0,
      currency: 'USD',
      verified: false
    }
  };

  // Create the document in Sanity
  const created = await client.create(doc);
  return created; // full created doc (contains _id)
}
