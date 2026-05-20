import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { updateAffiliate } from "@/lib/storage";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const affiliateId = Number(id);
  if (!affiliateId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const patch = body as Record<string, unknown>;
  const allowed: Record<string, unknown> = {};

  if (patch.status && ["pending", "active", "suspended"].includes(patch.status as string)) {
    allowed.status = patch.status;
  }
  if (typeof patch.commissionRate === "number" && patch.commissionRate >= 0 && patch.commissionRate <= 100) {
    allowed.commissionRate = patch.commissionRate;
  }
  if (typeof patch.iban === "string") allowed.iban = patch.iban;
  if (typeof patch.email === "string") allowed.email = patch.email;

  try {
    await updateAffiliate(affiliateId, allowed);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar afiliado" }, { status: 500 });
  }
}
