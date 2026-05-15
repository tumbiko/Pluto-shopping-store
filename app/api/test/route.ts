import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const order = await prisma.order.create({
    data: {
      orderNumber: `test-${Date.now()}`,
      customerName: "Vitumbiko",
      customerEmail: "test@example.com",
      totalPrice: 1200,
      status: "pending",
      items: [],
    },
  })

  return NextResponse.json(order)
}