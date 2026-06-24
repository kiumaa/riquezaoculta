import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { findAffiliateByToken, recordAffiliateClick } from "@/lib/storage";

export async function POST(req: NextRequest) {
  // Endpoint de tracking de alta frequência: se exceder, responde ok sem gravar
  // (não bloqueia a UX nem revela nada ao cliente).
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!consumeRateLimit(`afiliado-click:${ip}`, 30, 60_000).allowed) {
    return NextResponse.json({ ok: true });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // Silencioso
  }

  const { token } = body as Record<string, string>;
  if (!token) return NextResponse.json({ ok: true });

  const affiliate = await findAffiliateByToken(token);
  if (!affiliate || affiliate.status !== "active") {
    return NextResponse.json({ ok: true }); // Silencioso — não revelar se existe
  }

  await recordAffiliateClick(token).catch(() => {});

  return NextResponse.json({ ok: true });
}
