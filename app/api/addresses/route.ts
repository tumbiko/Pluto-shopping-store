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
  [key: string]: unknown;
}

/**
 * Address payload for POST / PATCH
 */
interface AddressPayload {
  userId?: string;
  phone?: string;
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

/** Simple in-memory cache for operators */
let _operatorsCache: { ts: number; data: Operator[] } | null = null;
const OPERATORS_TTL_MS = 60 * 1000; // 1 minute

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
      const text = await res.text().catch(() => "<could not read body>");
      console.error("PayChangu operators fetch failed:", res.status, text);
      return [];
    }

    const json = await res.json().catch(() => null);
    const ops: Operator[] = Array.isArray(json?.data)
      ? json!.data
      : Array.isArray(json)
      ? json
      : [];

    _operatorsCache = { ts: Date.now(), data: ops };
    return ops;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error fetching PayChangu operators:", message);
    return [];
  }
}

/**
 * Utility: map operator identifier (short_code | id | ref_id | name) to ref_id
 */
async function resolveOperatorRefId(operator?: string, phone?: string): Promise<string | null> {
  if (!operator && !phone) return null;
  const operators = await fetchOperatorsFromPayChangu();

  if (operator) {
    const match = operators.find(
      (op) =>
        String(op.short_code) === String(operator) ||
        String(op.id) === String(operator) ||
        String(op.ref_id) === String(operator) ||
        String(op.name) === String(operator)
    );
    if (match) return match.ref_id;
  }

  // fallback: try basic detection by phone prefix (small heuristic)
  if (phone) {
    const p = phone.replace(/\D/g, "");
    // example mapping (same as front-end)
    if (p.startsWith("88") || p.startsWith("89")) {
      const tnm = operators.find((o) => String(o.short_code).toLowerCase() === "tnm");
      return tnm?.ref_id ?? null;
    }
    if (p.startsWith("97") || p.startsWith("98") || p.startsWith("99")) {
      const airtel = operators.find((o) => String(o.short_code).toLowerCase() === "airtel");
      return airtel?.ref_id ?? null;
    }
  }

  return null;
}

/**
 * When setting an address default for a user, unset other defaults
 */
async function unsetOtherDefaultsForUser(userId: string, keepId?: string) {
  try {
    // fetch addresses that are default=true for this user
    const q = `*[_type == "address" && userId == $userId && default == true]{ _id }`;
    const currentDefaults: { _id: string }[] = await client.fetch(q, { userId });

    const toUnset = currentDefaults.filter((d) => d._id !== keepId);
    if (!toUnset.length) return;

    // patch each to set default:false
    const patches = toUnset.map((d) =>
      writeClient.patch(d._id).set({ default: false }).commit()
    );
    await Promise.all(patches);
  } catch (err) {
    console.error("Failed to unset other defaults:", err);
    // don't throw — we don't want to block the main operation, but log for debugging
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

    // Map operator to operatorRefId (if possible)
    const operatorRefId = (await resolveOperatorRefId(data.operator, data.phone)) ?? null;
    
    // replace the `const doc: Record<string, unknown> = { ... }` line
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
} as { _type: "address"; [key: string]: any };


    // If incoming default === true, unset other defaults for this user first
    if (doc.default === true) {
      await unsetOtherDefaultsForUser(String(data.userId));
    }

    const created = await writeClient.create(doc);

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("API Error (create address):", message);
    return NextResponse.json({ error: "Failed to add address", details: message }, { status: 500 });
  }
}

/**
 * GET: Fetch addresses by userId
 *
 * NOTE: returns a plain array (not wrapped in a {status,data} object) so front-end can do:
 * const list = await fetch(`/api/addresses?userId=${id}`).then(r => r.json())
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Order by creation time
    const query = `*[_type=="address" && userId == $userId] | order(_createdAt desc){
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
      default,
      createdAt,
      operatorName
    }`;

    const addresses = await client.fetch(query, { userId });

    // return the array directly (200)
    return NextResponse.json(addresses);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch addresses:", message);
    return NextResponse.json({ error: "Failed to fetch addresses", details: message }, { status: 500 });
  }
}

/**
 * PATCH: Update an address
 * expects JSON { id: "<sanityId>", updates: { ...fieldsToSet } }
 *
 * If updates.default === true then server will unset other defaults for the user.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id: string | undefined = body?.id;
    const updates: Partial<AddressPayload & { operatorRefId?: string; operatorName?: string; userId?:string }> =
      body?.updates ?? {};

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // If operator was passed as some identifier, try to resolve ref_id if not provided
    if (updates.operator && !updates.operatorRefId) {
      const maybeRef = await resolveOperatorRefId(updates.operator, updates.phone);
      if (maybeRef) updates.operatorRefId = maybeRef;
    }

    // Fetch address to get userId if needed
    let existing: any = null;
    try {
      existing = await client.fetch('*[_type=="address" && _id==$id][0]', { id });
    } catch (e) {
      // ignore; existing may be null and we handle later
    }

    // If setting default=true, unset other defaults first (we need userId)
    const userId = updates.userId ?? existing?.userId;
    if (updates.default === true && userId) {
      await unsetOtherDefaultsForUser(String(userId), id);
    }

    // Apply patch
    const patch = writeClient.patch(id).set(updates);
    const updated = await patch.commit();

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("PATCH /api/addresses error:", message);
    return NextResponse.json({ error: "Failed to update address", details: message }, { status: 500 });
  }
}

/**
 * DELETE: delete an address by id query param: /api/addresses?id=<id>
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id query param" }, { status: 400 });
    }

    await writeClient.delete(id);
    return NextResponse.json({ status: "success", id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("DELETE /api/addresses error:", message);
    return NextResponse.json({ error: "Failed to delete address", details: message }, { status: 500 });
  }
}
