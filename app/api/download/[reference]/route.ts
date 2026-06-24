import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { findCheckout } from "@/lib/storage";
import { getDeliverables, getDeliverableById } from "@/lib/fulfillment";

// GET /api/download/{reference}?item=guia1m|bonus
// Serve o ficheiro entregável correto para um checkout pago. Sem `item`, devolve
// o guia principal. Itens não comprados (ou produto Quiz, que não tem PDF) → 403.
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  const { reference } = await context.params;
  const record = await findCheckout(reference);

  if (!record || record.status !== "paid") {
    return new NextResponse("Acesso negado. Pagamento não confirmado.", { status: 403 });
  }

  const itemId = new URL(req.url).searchParams.get("item") ?? "guia1m";
  const deliverable = getDeliverableById(itemId);
  if (!deliverable) {
    return new NextResponse("Produto inválido.", { status: 400 });
  }

  const allowed = await getDeliverables(record.providerPayload, record.amount);
  if (!allowed.some(d => d.id === deliverable.id)) {
    return new NextResponse(
      "Esta referência não dá acesso a este produto.",
      { status: 403 }
    );
  }

  try {
    const filePath = path.join(process.cwd(), "data", deliverable.file);
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${deliverable.downloadName}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return new NextResponse("Ficheiro não encontrado.", { status: 404 });
  }
}
