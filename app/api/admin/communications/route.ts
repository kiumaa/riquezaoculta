import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getCommunicationLogs } from "@/lib/storage";

// GET /api/admin/communications?reference=ROV2-... | ?phone=2449...
// Devolve a cronologia de comunicações (WhatsApp/SMS) de um checkout ou cliente.
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference") ?? undefined;
  const phone = searchParams.get("phone") ?? undefined;

  if (!reference && !phone) {
    return NextResponse.json({ error: "reference or phone required" }, { status: 400 });
  }
  if ((reference && reference.length > 64) || (phone && phone.length > 24)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const data = await getCommunicationLogs({ reference, phone, limit: 50 });
  return NextResponse.json({ data });
}
