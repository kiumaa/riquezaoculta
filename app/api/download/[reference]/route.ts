import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { findCheckout } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  const { reference } = await context.params;
  const record = await findCheckout(reference);

  if (!record || record.status !== "paid") {
    return new NextResponse("Acesso negado. Pagamento não confirmado.", { status: 403 });
  }

  // Validação estrita do produto para separar o Quiz do Ebook
  const payload = typeof record.providerPayload === "object" && record.providerPayload !== null
    ? (record.providerPayload as Record<string, unknown>)
    : null;
  
  const product = payload && typeof payload.product === "string" ? payload.product : undefined;
  const amount = record.amount;

  if (product === "quiz" || amount <= 1000) {
    return new NextResponse(
      "Esta referência apenas dá acesso à análise completa do simulador, não ao Ebook. Adquira o Ebook para efetuar o download.",
      { status: 403 }
    );
  }

  try {
    const filePath = path.join(process.cwd(), "data", "Riqueza_Oculta.pdf");
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=Riqueza_Oculta.pdf",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Ficheiro não encontrado.", { status: 404 });
  }
}
