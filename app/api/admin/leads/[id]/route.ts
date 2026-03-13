import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { updateLeadNotes, updateLeadStatus } from "@/lib/storage";
import type { LeadStatus } from "@/lib/types";

const VALID_STATUSES: LeadStatus[] = ["novo", "contactado", "comprou", "abandonou", "upsell"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leadId = Number(id);
  if (isNaN(leadId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await updateLeadStatus(leadId, body.status);
  }

  if (body.notes !== undefined) {
    await updateLeadNotes(leadId, String(body.notes));
  }

  return NextResponse.json({ ok: true });
}
