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

  try {
    const filePath = path.join(process.cwd(), "public", "Riqueza_Oculta.pdf");
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
