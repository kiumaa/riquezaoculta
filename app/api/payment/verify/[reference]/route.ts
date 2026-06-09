import { NextRequest, NextResponse } from "next/server";
import { findCheckout } from "@/lib/storage";

// GET /api/payment/verify/{reference}
// Verificação read-only (sem efeitos colaterais) usada pela página /acesso
// para validar um link tokenizado vindo do WhatsApp em qualquer dispositivo.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  const { reference } = await context.params;
  const record = await findCheckout(reference);
  const paid = record?.status === "paid";

  let isEbook = false;
  if (paid && record) {
    const payload = typeof record.providerPayload === "object" && record.providerPayload !== null
      ? (record.providerPayload as Record<string, unknown>)
      : null;
    const product = payload && typeof payload.product === "string" ? payload.product : undefined;
    isEbook = !(product === "quiz" || record.amount <= 1000);
  }

  return NextResponse.json({ paid, isEbook, name: record?.name ?? null });
}
