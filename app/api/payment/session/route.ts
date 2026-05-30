import { NextRequest, NextResponse } from "next/server";
import { createCharge, createExpressCharge } from "@/lib/providers/payment/kbagency";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";
import { getSettings, insertCheckout } from "@/lib/storage";
import { sendPaymentReferenceSms } from "@/lib/providers/sms/bulkgate";
import { env, isProd } from "@/lib/env";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(24),
  method: z.enum(["express", "reference"]).default("reference"),
  expressPhone: z.string().min(9).max(15).optional(),
  affiliateToken: z.string().max(32).optional(),
  product: z.enum(["ebook", "quiz", "ebook_upsell"]).default("ebook"),
});

function makeReference() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ROV2-${Date.now().toString(36).toUpperCase()}-${random}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  console.log(`[Payment Session] ========== ${requestId} ==========`);
  console.log("[Payment Session] Request received", { ip, isProd, url: req.url });
  
  const rate = consumeRateLimit(`payment-session:${ip}`, 10, 60_000);

  if (!rate.allowed) {
    console.log("[Payment Session] Rate limited", { ip });
    return NextResponse.json({ error: "Too many payment attempts" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reference = makeReference();
  const now = new Date().toISOString();
  const { pricePromo, priceQuiz } = await getSettings();

  let amount = pricePromo;
  let description = "Guia 1M Em Uma Semana";

  if (parsed.data.product === "quiz") {
    amount = priceQuiz;
    description = "Análise Completa do Quiz - 1M Em Uma Semana";
  } else if (parsed.data.product === "ebook_upsell") {
    amount = pricePromo;
    description = "Guia 1M Em Uma Semana (Upsell Especial)";
  }

  if (parsed.data.method === "express") {
    if (!parsed.data.expressPhone) {
      return NextResponse.json({ error: "expressPhone is required for Express payments" }, { status: 400 });
    }

    let charge: Awaited<ReturnType<typeof createExpressCharge>>;
    try {
      charge = await createExpressCharge({
        phone: parsed.data.expressPhone.replace(/\D/g, ""),
        amount,
        reference
      });
    } catch {
      return NextResponse.json(
        { error: "Não foi possível iniciar o pagamento via Multicaixa Express. Usa o método de Referência (ATM/Internet Banking)." },
        { status: 502 }
      );
    }

    await insertCheckout({
      reference,
      name: parsed.data.name.trim(),
      phone: normalizePhone(parsed.data.phone),
      amount: charge.amount,
      entity: "express",
      paymentReference: charge.reference,
      status: "pending",
      providerPayload: { method: "express", mode: charge.mode, product: parsed.data.product },
      affiliateToken: parsed.data.affiliateToken ?? null,
      createdAt: now,
      updatedAt: now
    });

    return NextResponse.json({
      reference,
      method: "express",
      payment: {
        reference: charge.reference,
        amount: charge.amount,
        mode: charge.mode
      }
    });
  }

  // Reference method
  console.log("[Payment Session] Creating reference charge", {
    reference,
    amount: pricePromo,
    hasApiKey: !!env.KB_AGENCY_API_KEY,
    isProd
  });

  const charge = await createCharge({
    amount,
    reference,
    description
  });

  console.log("[Payment Session] Charge created", {
    reference,
    mode: charge.mode,
    entity: charge.entity,
    hasPaymentUrl: !!charge.paymentUrl
  });

  // Em produção, se não tiver API key e estiver em modo simulado, alertar e retornar erro
  if (isProd && charge.mode === "simulated") {
    console.error("[Payment Session] ALERTA: Modo simulado em produção!", {
      reference,
      hasKbAgencyKey: !!env.KB_AGENCY_API_KEY,
      hasKbExpressKey: !!env.KB_API_EXPRESS_KEY,
      simulatedEntity: charge.entity,
      simulatedRef: charge.paymentReference
    });
    
    // Log detalhado para debugging
    if (!env.KB_AGENCY_API_KEY) {
      console.error("[Payment Session] KB_AGENCY_API_KEY não configurada");
    }
    
    return NextResponse.json(
      { error: "Serviço de pagamento temporariamente indisponível. Tenta novamente mais tarde ou contacta o suporte." },
      { status: 503 }
    );
  }
  
  // Log de confirmação em modo live
  if (charge.mode === "live") {
    console.log("[Payment Session] Pagamento em modo LIVE criado com sucesso", {
      reference,
      entity: charge.entity,
      amount: charge.amount
    });
  }

  await insertCheckout({
    reference,
    name: parsed.data.name.trim(),
    phone: normalizePhone(parsed.data.phone),
    amount: charge.amount,
    entity: charge.entity,
    paymentReference: charge.paymentReference,
    status: "pending",
    providerPayload: { ...(charge.raw as Record<string, unknown>), product: parsed.data.product },
    affiliateToken: parsed.data.affiliateToken ?? null,
    createdAt: now,
    updatedAt: now
  });

  // Send reference via SMS so user has it on their phone when going to ATM
  sendPaymentReferenceSms(
    normalizePhone(parsed.data.phone),
    parsed.data.name.trim(),
    charge.entity,
    charge.paymentReference,
    charge.amount
  ).catch((err) => {
    console.error("[Payment Session] SMS failed", err);
  });

  console.log(`[Payment Session] ${requestId} - SUCESSO`, {
    reference,
    entity: charge.entity,
    mode: charge.mode,
    hasPaymentUrl: !!charge.paymentUrl
  });
  
  return NextResponse.json({
    reference,
    method: "reference",
    payment: {
      entity: charge.entity,
      reference: charge.paymentReference,
      paymentUrl: charge.paymentUrl,
      amount: charge.amount,
      mode: charge.mode
    }
  });
}
