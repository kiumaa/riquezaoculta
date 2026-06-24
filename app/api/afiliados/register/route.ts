import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit";
import { findAffiliateByPhone, generateAffiliateToken, insertAffiliate } from "@/lib/storage";

async function notifyPushcut(title: string, text: string) {
  if (!env.PUSHCUT_URL) return;
  try {
    await fetch(env.PUSHCUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, text }),
    });
  } catch { /* não bloquear */ }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!consumeRateLimit(`afiliado-register:${ip}`, 5, 60_000).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { name, phone, email, iban } = body as Record<string, string>;

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Nome obrigatório (mín. 2 caracteres)" }, { status: 400 });
  }
  if (!phone || phone.trim().length < 7) {
    return NextResponse.json({ error: "Telefone obrigatório" }, { status: 400 });
  }

  // Verificar duplicado
  const existing = await findAffiliateByPhone(phone.trim());
  if (existing) {
    return NextResponse.json({ error: "Este telefone já tem um pedido de afiliado" }, { status: 409 });
  }

  const token = generateAffiliateToken();

  const affiliate = await insertAffiliate({
    token,
    name: name.trim(),
    phone: phone.trim(),
    email: email?.trim() || null,
    iban: iban?.trim() || null,
    status: "pending",
    commissionRate: 30,
    totalClicks: 0,
    totalSales: 0,
    totalEarnings: 0,
    currentBalance: 0,
  });

  if (!affiliate) {
    return NextResponse.json({ error: "Erro ao criar afiliado" }, { status: 500 });
  }

  void notifyPushcut(
    "🤝 Novo pedido de afiliado",
    `${name.trim()} (${phone.trim()}) quer ser afiliado. Aprova em /admin/afiliados`
  );

  return NextResponse.json({ token, message: "Pedido recebido — aguarda aprovação" }, { status: 201 });
}
