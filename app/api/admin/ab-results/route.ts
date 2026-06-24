import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { checkouts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AB_TESTS } from "@/lib/ab";

export const dynamic = "force-dynamic";

// Conversões (checkouts pagos) por teste/variante — lê providerPayload.ab.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Inicializa todos os testes/variantes a zero (para mostrar mesmo sem dados).
  const tests: Record<string, Record<string, number>> = {};
  for (const [key, cfg] of Object.entries(AB_TESTS)) {
    tests[key] = {};
    for (const v of cfg.variants) tests[key][v] = 0;
  }

  if (db) {
    const rows = await db
      .select({ providerPayload: checkouts.providerPayload })
      .from(checkouts)
      .where(eq(checkouts.status, "paid"));

    for (const row of rows) {
      const payload = row.providerPayload as Record<string, unknown> | null;
      const ab = payload?.ab;
      if (ab && typeof ab === "object") {
        for (const [test, variant] of Object.entries(ab as Record<string, unknown>)) {
          if (tests[test] && typeof variant === "string" && variant in tests[test]) {
            tests[test][variant] += 1;
          }
        }
      }
    }
  }

  return NextResponse.json({ tests });
}
