import { NextRequest, NextResponse } from "next/server";
import { writeClient, client } from "@/sanity/lib/client";

/**
 * Operator type from PayChangu API
 */
interface Operator {
  id: number | string;
  short_code: string;
  ref_id: string;
  name: string;
  [key: string]: unknown; // for any additional fields returned by API
}

/**
 * Address payload for POST
 */
interface AddressPayload {
  userId: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  operator?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  default?: boolean;
}

/**
 * Simple in-memory cache for operators
 */
let _operatorsCache: { ts: number; data: Operator[] } | null = null;
const OPERATORS_TTL_MS = 60 * 1000; // 1 minute

/**
 * Fetch operators from PayChangu with caching
 */
async function fetchOperatorsFromPayChangu(): Promise<Operator[]> {
  if (_operatorsCache && Date.now() - _operatorsCache.ts < OPERATORS_TTL_MS) {
    return _operatorsCache.data;
  }

  const secret = process.env.PAYCHANGU_SECRET_KEY;
  if (!secret) {
    console.warn("Missing PAYCHANGU_SECRET_KEY; skipping operator fetch");
    return [];
  }

  try {
    const res = await fetch("https://api.paychangu.com/mobile-money", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("PayChangu operators fetch failed:", res.status, text);
      return [];
    }

    const json = await res.json();
    const ops: Operator[] = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json)
      ? json
      : [];

    _operatorsCache = { ts: Date.now(), data: ops };
    return ops;
  } catch (error: unknown) {
    console.error("Error fetching PayChangu operators:", error);
    return [];
  }
}

/**
 * POST: Add a new address
 */
export async function POST(req: NextRequest) {
  try {
    const data: AddressPayload = await req.json();

    if (!data.userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (!data.phone) {
      return NextResponse.json({ error: "Missing phone" }, { status: 400 });
    }

    // Map operator short_code or id to operatorRefId
    let operatorRefId: string | null = null;
    if (data.operator) {
      const operators = await fetchOperatorsFromPayChangu();
      const match = operators.find(
        (op) =>
          String(op.short_code) === String(data.operator) ||
          String(op.id) === String(data.operator) ||
          String(op.ref_id) === String(data.operator)
      );
      if (match) operatorRefId = match.ref_id;
    }

    // Build Sanity doc
    const doc = {
      _type: "address",
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      email: data.email ?? "",
      phone: data.phone,
      operator: data.operator ?? "",
      operatorRefId,
      address: data.address ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      zip: data.zip ?? "",
      default: !!data.default,
      userId: data.userId,
      createdAt: new Date().toISOString(),
    };

    const created = await writeClient.create(doc);
    return NextResponse.json({ status: "success", data: created }, { status: 201 });
  } catch (error: unknown) {
    console.error("API Error (create address):", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to add address", details: message },
      { status: 500 }
    );
  }
}

/**
 * GET: Fetch addresses by userId
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const query = `*[_type=="address" && userId == $userId] | order(publishedAt desc){
      _id,
      firstName,
      lastName,
      email,
      phone,
      operator,
      operatorRefId,
      address,
      city,
      state,
      zip,
      default
    }`;

    const addresses = await client.fetch(query, { userId });

    return NextResponse.json({ status: "success", data: addresses });
  } catch (error: unknown) {
    console.error("Failed to fetch addresses:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch addresses", details: message },
      { status: 500 }
    );
  }
}
