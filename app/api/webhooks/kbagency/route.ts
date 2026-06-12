import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { env, isProd } from "@/lib/env";
import { extractWebhookReference, isWebhookPaid } from "@/lib/providers/payment/kbagency";
import { verifyWebhookSignature } from "@/lib/security/webhook-signature";
import { findCheckout, markCheckoutPaid, recordAffiliateSale } from "@/lib/storage";
import { sendFBConversionPurchase, extractMetaMatch } from "@/lib/capi";
import { sendOrderConfirmation } from "@/lib/communication-service";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let raw = "";
  
  console.log("[Webhook] ========== NOVO WEBHOOK ==========");
  console.log("[Webhook] Timestamp:", new Date().toISOString());
  console.log("[Webhook] Headers:", {
    signature: req.headers.get("x-kb-signature") || req.headers.get("x-kbagency-signature") || req.headers.get("x-signature") ? "presente" : "ausente",
    contentType: req.headers.get("content-type"),
    userAgent: req.headers.get("user-agent")
  });

  try {
    raw = await req.text();
    console.log("[Webhook] Body recebido:", raw.substring(0, 500));

    // KB Agency (API Ultra) envia a assinatura no header X-KB-Signature.
    const signature = req.headers.get("x-kb-signature") || req.headers.get("x-kbagency-signature") || req.headers.get("x-signature");

    // DIAGNÓSTICO TEMPORÁRIO — testa todos os secrets que temos contra a assinatura
    // real da KB, para descobrir com qual ela assina. Log curto (contorna o corte dos logs).
    try {
      const recv = (signature || "").trim();
      const cands: Record<string, string | undefined> = {
        whsec: env.KB_AGENCY_WEBHOOK_SECRET,
        apikey: env.KB_AGENCY_API_KEY,
        expresskey: env.KB_API_EXPRESS_KEY
      };
      const matches = Object.entries(cands)
        .filter(([, s]) => s && crypto.createHmac("sha256", s).update(raw).digest("hex") === recv)
        .map(([n]) => n);
      const sigHdrs = [...req.headers.keys()].filter((k) => /sig|kb|hmac|hash/i.test(k)).join(",");
      console.log(`WHSIG2|hdrs=${sigHdrs}|secretPfx=${(env.KB_AGENCY_WEBHOOK_SECRET || "").slice(0, 6)}|matches=${matches.join(",") || "NENHUM"}`);
    } catch { /* diag não deve quebrar o webhook */ }

    console.log("[Webhook] Received webhook", {
      timestamp: new Date().toISOString(),
      hasSignature: !!signature,
      bodyLength: raw.length
    });

    // Verificar assinatura se secret configurado
    if (env.KB_AGENCY_WEBHOOK_SECRET) {
      const valid = verifyWebhookSignature(raw, env.KB_AGENCY_WEBHOOK_SECRET, signature);
      if (!valid) {
        console.warn("[Webhook] Invalid signature", { signature });
        return NextResponse.json({ error: "invalid signature" }, { status: 401 });
      }
    } else if (isProd) {
      console.error("[Webhook] Webhook secret required in production but not configured");
      return NextResponse.json({ error: "webhook secret required in production" }, { status: 500 });
    }

    // Parse do payload
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      console.error("[Webhook] Invalid JSON payload", { raw: raw.slice(0, 200) });
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const reference = extractWebhookReference(payload);

    if (!reference) {
      console.warn("[Webhook] Missing reference in payload", { payload });
      return NextResponse.json({ error: "missing reference" }, { status: 400 });
    }

    console.log("[Webhook] Processing reference", { reference, event: payload.event });

    // Verificar se checkout existe antes de atualizar
    const checkout = await findCheckout(reference);
    if (!checkout) {
      console.warn("[Webhook] Checkout not found", { reference });
      // Retornar 200 para evitar retries desnecessários do gateway
      return NextResponse.json({ received: true, warning: "checkout not found" });
    }

    // Se já está pago, não processar novamente (idempotência)
    if (checkout.status === "paid") {
      console.log("[Webhook] Checkout already paid, ignoring", { reference });
      return NextResponse.json({ received: true, status: "already_paid" });
    }

    // Processar pagamento confirmado
    if (isWebhookPaid(payload)) {
      try {
        // Transição atómica: os side-effects só correm para quem realizou a transição,
        // evitando duplo Purchase/comissão/confirmação se webhook e polling concorrerem.
        const didTransition = await markCheckoutPaid(reference, payload);
        if (didTransition) {
          void recordAffiliateSale(reference).catch(() => {});

          // Enviar evento Purchase Server-Side para Meta Conversions API (non-blocking)
          const referer = req.headers.get("referer") ?? undefined;
          void sendFBConversionPurchase(
            checkout.name,
            checkout.phone,
            checkout.amount,
            checkout.reference,
            referer,
            extractMetaMatch(checkout.providerPayload)
          ).catch(() => {});
          void sendOrderConfirmation(checkout.phone, checkout.name, { reference: checkout.reference }).catch(() => {});

          console.log("[Webhook] Payment marked as paid & Purchase sent to CAPI", {
            reference,
            duration: Date.now() - startTime,
            previousStatus: checkout.status
          });
        } else {
          console.log("[Webhook] Transição ignorada (já pago ou inexistente)", { reference });
        }
      } catch (updateError) {
        console.error("[Webhook] Failed to update checkout status", { 
          reference, 
          error: updateError 
        });
        // Retornar 500 para que o gateway faça retry
        return NextResponse.json({ error: "failed to update status" }, { status: 500 });
      }
    } else {
      console.log("[Webhook] Payment not confirmed as paid", { 
        reference, 
        status: payload.status,
        event: payload.event 
      });
    }

    return NextResponse.json({ received: true, processed: true });
    
  } catch (error) {
    console.error("[Webhook] Unhandled error", { 
      error, 
      duration: Date.now() - startTime,
      body: raw.slice(0, 500)
    });
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
