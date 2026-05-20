import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { updatePayoutRequest } from "@/lib/storage";
import type { PayoutStatus } from "@/lib/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const payoutId = Number(id);
  if (!payoutId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { status, notes } = body as { status: PayoutStatus; notes?: string };
  if (!status || !["pending", "approved", "paid", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  try {
    await updatePayoutRequest(payoutId, status, notes);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar levantamento" }, { status: 500 });
  }
}
