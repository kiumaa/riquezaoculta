import { NextRequest, NextResponse } from "next/server";
import { createExpressCharge } from "@/lib/providers/payment/kbagency";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";
import { getSettings, insertCheckout } from "@/lib/storage";
import { env, isProd } from "@/lib/env";
import { z } from "zod";

export const preferredRegion = "cpt1";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(24),
  expressPhone: z.string().min(9).max(15),
  product: z.enum(["ebook", "quiz", "ebook_upsell"]).default("ebook"),
  orderBump: z.number().min(0).max(5000).optional(),
  affiliateToken: z.string().max(32).optional(),
  fbp: z.string().max(255).optional(),
  fbc: z.string().max(255).optional(),
});

function makeReference() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ROV2-${Date.now().toString(36).toUpperCase()}-${random}`;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const timings: Record<string, number> = {};
  
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    
    // Rate check
    const rateStart = Date.now();
    const rate = consumeRateLimit(`payment-express:${ip}`, 10, 60_000);
    timings.rateLimit = Date.now() - rateStart;
    
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many payment attempts" }, { status: 429 });
    }

    // Parse body
    const parseStart = Date.now();
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    timings.parse = Date.now() - parseStart;

    const reference = makeReference();
    const now = new Date().toISOString();

    // Sinais de correspondência (EMQ) para o evento Purchase server-side (CAPI)
    const metaMatch = {
      fbp: parsed.data.fbp,
      fbc: parsed.data.fbc,
      clientIpAddress: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || undefined,
      clientUserAgent: req.headers.get("user-agent") ?? undefined,
    };

    // Get settings (cached)
    const settingsStart = Date.now();
    const { pricePromo, priceQuiz } = await getSettings();
    timings.settings = Date.now() - settingsStart;

    let amount = pricePromo;
    if (parsed.data.product === "quiz") {
      amount = priceQuiz;
    } else if (parsed.data.product === "ebook_upsell") {
      amount = pricePromo;
    }

    // Add order bump amount if selected
    if (parsed.data.orderBump && parsed.data.orderBump > 0) {
      amount += parsed.data.orderBump;
    }

    // Normalizar para o formato MCX Express: 9 dígitos a começar por 9.
    // (remove código de país 244, zeros à esquerda, espaços/símbolos)
    let mcxPhone = parsed.data.expressPhone.replace(/\D/g, "");
    if (mcxPhone.startsWith("244")) mcxPhone = mcxPhone.slice(3);
    mcxPhone = mcxPhone.replace(/^0+/, "");
    if (mcxPhone.length > 9) mcxPhone = mcxPhone.slice(-9);

    // Validar o formato MCX antes de enviar à KB (evita charge que falha o push).
    if (mcxPhone.length !== 9 || !mcxPhone.startsWith("9")) {
      return NextResponse.json(
        { error: "Número Multicaixa Express inválido. Usa 9 dígitos a começar por 9 (ex.: 9XX XXX XXX)." },
        { status: 400 }
      );
    }

    // Create charge - THIS IS THE BOTTLENECK (KB API)
    const chargeStart = Date.now();
    const charge = await createExpressCharge({
      phone: mcxPhone,
      reference,
      amount
    });
    timings.kbApi = Date.now() - chargeStart;

    // Guarda anti-simulado ANTES de gravar — nunca criar checkout órfão se não há cobrança real.
    if (isProd && charge.mode === "simulated") {
      console.error("[Express Payment] ALERTA: Modo simulado em produção!", {
        reference,
        hasKbAgencyKey: !!env.KB_AGENCY_API_KEY
      });

      return NextResponse.json(
        { error: "Serviço Multicaixa Express temporariamente indisponível. Tenta novamente mais tarde ou usa pagamento por Referência." },
        { status: 503 }
      );
    }

    // Insert checkout
    const dbStart = Date.now();
    await insertCheckout({
      reference,
      name: parsed.data.name.trim(),
      phone: normalizePhone(parsed.data.phone),
      amount: charge.amount,
      entity: "express",
      paymentReference: charge.reference,
      status: "pending",
      providerPayload: { method: "express", mode: charge.mode, product: parsed.data.product, _mq: metaMatch },
      affiliateToken: parsed.data.affiliateToken ?? null,
      createdAt: now,
      updatedAt: now
    });
    timings.db = Date.now() - dbStart;

    const total = Date.now() - startTime;

    console.log(`[Express Payment] Timing:`, { total, ...timings, reference, mode: charge.mode });

    return NextResponse.json({
      reference,
      method: "express",
      payment: {
        reference: charge.reference,
        amount: charge.amount,
        mode: charge.mode
      }
    });

  } catch (error) {
    const total = Date.now() - startTime;
    console.error(`[Express Payment] Error after ${total}ms:`, error);

    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento Multicaixa Express agora. Aguarda um momento e tenta de novo, ou usa pagamento por Referência (ATM/Internet Banking)." },
      { status: 502 }
    );
  }
}
