import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit";

// Lead da consultoria (upsell pós-compra). Alto-ticket fecha melhor humano-a-humano,
// por isso notificamos a equipa (Pushcut) para fechar/cobrar por WhatsApp — em vez de
// fingir um pagamento que nunca acontece.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!consumeRateLimit(`upsell-interest:${ip}`, 5, 60_000).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { name, phone, reference } = (body ?? {}) as Record<string, string>;

  if (env.PUSHCUT_URL) {
    void fetch(env.PUSHCUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "🔥 Lead de Consultoria (upsell)",
        text: `${name?.trim() || "Cliente"} (${phone || "sem nº"}) quer a consultoria 1-a-1. Ref: ${reference || "-"}. Contacta no WhatsApp para agendar e cobrar.`
      })
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
