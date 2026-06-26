import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate the request using Clerk
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch the orders for this clerkUserId from PostgreSQL
    const orders = await prisma.order.findMany({
      where: {
        clerkUserId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Error fetching mobile orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
