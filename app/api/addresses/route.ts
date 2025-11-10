import { NextRequest, NextResponse } from "next/server";
import { writeClient, client } from "@/sanity/lib/client";

// POST: Add a new address
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const doc = await writeClient.create({
      _type: "address",
      ...data,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json(doc);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to add address" }, { status: 500 });
  }
}

// GET: Fetch addresses by userId
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const query = `*[_type=="address" && userId == $userId] | order(publishedAt desc)`;
    const addresses = await client.fetch(query, { userId });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Failed to fetch addresses:", error);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}
