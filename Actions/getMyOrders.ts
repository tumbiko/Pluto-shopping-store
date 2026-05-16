import { backendClient } from "@/sanity/lib/backendClient";

export interface MyOrder {
  _id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalPrice: number;
  currency: string;
  products: {
    product: {
      name: string;
      price: number;
      images: any[];
    };
    quantity: number;
  }[];
}

export async function getMyOrders(userId: string): Promise<MyOrder[]> {
  const query = `*[_type == "order" && clerkUserId == $userId] | order(orderDate desc) {
    _id,
    orderNumber,
    orderDate,
    status,
    totalPrice,
    currency,
    products[]{
      product->{
        name,
        price,
        images
      },
      quantity
    }
  }`;

  try {
    const orders = await backendClient.fetch(query, { userId });
    return orders || [];
  } catch (error) {
    console.error("Error fetching my orders:", error);
    return [];
  }
}
