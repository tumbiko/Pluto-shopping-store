import { writeClient } from "@/sanity/lib/writeclient";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const doc = await writeClient.create({
      _type: "address",
      firstName: "Test",
      lastName: "TokenCheck",
    });
    
    return NextResponse.json({ ok: true, doc });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message });
  }
}
