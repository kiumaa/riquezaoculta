import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { extractWebhookReference, isWebhookPaid, getChargeStatus } from "@/lib/providers/payment/kbagency";
import { verifyWebhookSignature } from "@/lib/security/webhook-signature";
import { findCheckout, markCheckoutPaid, recordAffiliateSale } from "@/lib/storage";
import { sendFBConversionPurchase, extractMetaMatch } from "@/lib/capi";
import { sendOrderConfirmation } from "@/lib/communication-service";

// Este handler pode chamar a API Ultra da KB (re-verificação de status), que faz
// whitelist por IP sul-africano — por isso é fixado à região cpt1 (Cape Town).
export const preferredRegion = "cpt1";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let raw = "";

  console.log("[Webhook] ========== NOVO WEBHOOK ==========");

  try {
    raw = await req.text();
    console.log("[Webhook] Body recebido:", raw.substring(0, 500));

    // KB Agency (API Ultra) envia a assinatura no header X-KB-Signature.
    const signature = req.headers.get("x-kb-signature") || req.headers.get("x-kbagency-signature") || req.headers.get("x-signature");

    // Validar assinatura (caminho rápido e de confiança).
    const signatureValid = !!env.KB_AGENCY_WEBHOOK_SECRET && verifyWebhookSignature(raw, env.KB_AGENCY_WEBHOOK_SECRET, signature);
    if (!signatureValid) {
      console.warn("[Webhook] Assinatura ausente/inválida — vai re-verificar o pagamento na API da KB antes de confirmar");
    }

    // Parse do payload
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      console.error("[Webhook] JSON inválido", { raw: raw.slice(0, 200) });
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const reference = extractWebhookReference(payload);
    if (!reference) {
      console.warn("[Webhook] Referência em falta no payload");
      return NextResponse.json({ error: "missing reference" }, { status: 400 });
    }

    console.log("[Webhook] Processing reference", { reference, event: payload.event, signatureValid });

    const checkout = await findCheckout(reference);
    if (!checkout) {
      // 200 para evitar retries inúteis do gateway.
      console.warn("[Webhook] Checkout não encontrado", { reference });
      return NextResponse.json({ received: true, warning: "checkout not found" });
    }

    // Idempotência: se já pago, não reprocessar.
    if (checkout.status === "paid") {
      return NextResponse.json({ received: true, status: "already_paid" });
    }

    if (isWebhookPaid(payload)) {
      // Só confiamos no payload se a assinatura for válida. Caso contrário, re-verificamos
      // o estado real na API AUTENTICADA da KB — assim um secret errado/ausente não perde
      // pagamentos, e um webhook forjado não consegue confirmar (a KB é a fonte da verdade).
      let confirmed = signatureValid;
      if (!signatureValid) {
        const provider = await getChargeStatus(checkout.reference);
        confirmed = provider.status === "paid";
        if (!confirmed) {
          console.warn("[Webhook] Sem assinatura válida e a KB não confirma pago — ignorado", { reference, kbStatus: provider.status });
          return NextResponse.json({ received: true, processed: false });
        }
        console.log("[Webhook] Pagamento re-verificado e confirmado pela API da KB", { reference });
      }

      try {
        // Transição atómica: os side-effects só correm para quem realiza a transição,
        // evitando duplo Purchase/comissão/confirmação se webhook e polling concorrerem.
        const didTransition = await markCheckoutPaid(reference, payload);
        if (didTransition) {
          void recordAffiliateSale(reference).catch(() => {});
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
          console.log("[Webhook] Pagamento marcado como pago & Purchase enviado ao CAPI", {
            reference,
            duration: Date.now() - startTime
          });
        } else {
          console.log("[Webhook] Transição ignorada (já pago ou inexistente)", { reference });
        }
      } catch (updateError) {
        console.error("[Webhook] Falha ao atualizar estado do checkout", { reference, error: updateError });
        // 500 para que o gateway faça retry.
        return NextResponse.json({ error: "failed to update status" }, { status: 500 });
      }
    } else {
      console.log("[Webhook] Pagamento não confirmado como pago", { reference, status: payload.status, event: payload.event });
    }

    return NextResponse.json({ received: true, processed: true });

  } catch (error) {
    console.error("[Webhook] Erro não tratado", { error, duration: Date.now() - startTime, body: raw.slice(0, 500) });
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
