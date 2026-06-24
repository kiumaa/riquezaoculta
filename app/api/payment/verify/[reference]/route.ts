import { NextRequest, NextResponse } from "next/server";
import { findCheckout } from "@/lib/storage";
import { getDeliverables } from "@/lib/fulfillment";

// GET /api/payment/verify/{reference}
// Verificação read-only (sem efeitos colaterais) usada pela página /acesso para
// validar um link tokenizado vindo do WhatsApp em QUALQUER dispositivo e saber
// que entregáveis (guia 1M e/ou bónus) mostrar.
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  const { reference } = await context.params;
  const record = await findCheckout(reference);
  const paid = record?.status === "paid";

  const items =
    paid && record
      ? (await getDeliverables(record.providerPayload, record.amount)).map(d => ({
          id: d.id,
          title: d.title
        }))
      : [];

  return NextResponse.json({ paid, name: record?.name ?? null, items });
}
