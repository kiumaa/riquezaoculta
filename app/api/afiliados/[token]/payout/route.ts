import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { findAffiliateByToken, insertPayoutRequest, updateAffiliate } from "@/lib/storage";

const MIN_PAYOUT = 5000; // 5000 Kz mínimo

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

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const affiliate = await findAffiliateByToken(token);
  if (!affiliate || affiliate.status !== "active") {
    return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const amount = Number((body as Record<string, unknown>).amount);
  if (!amount || amount < MIN_PAYOUT) {
    return NextResponse.json({ error: `Valor mínimo de levantamento: ${MIN_PAYOUT.toLocaleString("pt-AO")} Kz` }, { status: 400 });
  }
  if (amount > affiliate.currentBalance) {
    return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });
  }

  await insertPayoutRequest(affiliate.id, amount);
  await updateAffiliate(affiliate.id, { currentBalance: affiliate.currentBalance - amount });

  void notifyPushcut(
    "💸 Pedido de levantamento",
    `${affiliate.name} pediu ${amount.toLocaleString("pt-AO")} Kz. Aprovação em /admin/afiliados/payouts`
  );

  return NextResponse.json({ success: true });
}
