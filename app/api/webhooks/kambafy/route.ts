import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyWebhookSignature } from "@/lib/security/webhook-signature";
import { findCheckout, insertCheckout, recordAffiliateSale, updateCheckoutStatus } from "@/lib/storage";
import { sendFBConversionPurchase } from "@/lib/capi";
import { sendOrderConfirmationWhatsApp } from "@/lib/whatsapp";

async function notifyPushcut(title: string, text: string) {
  const url = env.PUSHCUT_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, text }),
    });
  } catch {
    // Notificações não devem bloquear o processamento do pagamento
  }
}

// Helpers para extrair campos do payload Kambafy (formato ainda desconhecido — ser flexível)
function extractReference(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined;
  return (
    (payload.reference as string) ||
    (payload.transaction_id as string) ||
    (payload.order_id as string) ||
    (payload.id as string) ||
    (data?.reference as string) ||
    (data?.transaction_id as string) ||
    (data?.id as string) ||
    null
  );
}

function extractStatus(payload: Record<string, unknown>): string {
  const data = payload.data as Record<string, unknown> | undefined;
  return (
    (payload.status as string) ||
    (data?.status as string) ||
    (payload.event as string) ||
    ""
  );
}

function isPaid(payload: Record<string, unknown>): boolean {
  const status = extractStatus(payload).toLowerCase();
  return (
    status === "paid" ||
    status === "success" ||
    status === "completed" ||
    status === "payment.success" ||
    payload.event === "payment.success" ||
    payload.event === "payment.paid"
  );
}

function extractCustomerName(payload: Record<string, unknown>): string {
  const customer = payload.customer as Record<string, unknown> | undefined;
  return (
    (customer?.name as string) ||
    (customer?.full_name as string) ||
    (payload.customer_name as string) ||
    (payload.name as string) ||
    "Desconhecido"
  );
}

function extractCustomerPhone(payload: Record<string, unknown>): string {
  const customer = payload.customer as Record<string, unknown> | undefined;
  return (
    (customer?.phone as string) ||
    (customer?.msisdn as string) ||
    (payload.customer_phone as string) ||
    (payload.phone as string) ||
    (payload.msisdn as string) ||
    ""
  );
}

function extractAmount(payload: Record<string, unknown>): number {
  const data = payload.data as Record<string, unknown> | undefined;
  const raw =
    (payload.amount as number) ||
    (payload.total as number) ||
    (payload.value as number) ||
    (data?.amount as number) ||
    0;
  return Number(raw) || 0;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let raw = "";

  console.log("[Kambafy] ========== NOVO WEBHOOK ==========");
  console.log("[Kambafy] Timestamp:", new Date().toISOString());
  console.log("[Kambafy] Headers:", {
    signature: req.headers.get("x-kambafy-signature") || req.headers.get("x-signature") ? "presente" : "ausente",
    contentType: req.headers.get("content-type"),
    userAgent: req.headers.get("user-agent"),
  });

  try {
    raw = await req.text();
    console.log("[Kambafy] Body recebido:", raw.substring(0, 1000));

    const signature =
      req.headers.get("x-kambafy-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("x-webhook-signature");

    // Verificar assinatura se secret configurado
    if (env.KAMBAFY_WEBHOOK_SECRET) {
      const valid = verifyWebhookSignature(raw, env.KAMBAFY_WEBHOOK_SECRET, signature);
      if (!valid) {
        console.warn("[Kambafy] Assinatura inválida", { signature });
        return NextResponse.json({ error: "invalid signature" }, { status: 401 });
      }
    }

    // Parse do payload
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      console.error("[Kambafy] JSON inválido", { raw: raw.slice(0, 200) });
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    console.log("[Kambafy] Payload parsed:", JSON.stringify(payload).substring(0, 500));

    const reference = extractReference(payload);
    if (!reference) {
      console.warn("[Kambafy] Referência em falta no payload", { payload });
      return NextResponse.json({ error: "missing reference" }, { status: 400 });
    }

    console.log("[Kambafy] Processing reference:", reference);

    // Verificar se checkout já existe
    const existing = await findCheckout(reference);

    if (existing?.status === "paid") {
      console.log("[Kambafy] Já pago, ignorar (idempotência)", { reference });
      return NextResponse.json({ received: true, status: "already_paid" });
    }

    if (!isPaid(payload)) {
      console.log("[Kambafy] Pagamento não confirmado como pago", {
        reference,
        status: extractStatus(payload),
        event: payload.event,
      });
      return NextResponse.json({ received: true, processed: false });
    }

    const customerName = extractCustomerName(payload);
    const customerPhone = extractCustomerPhone(payload);
    const amount = extractAmount(payload);

    if (existing) {
      // Checkout existe — atualizar status
      await updateCheckoutStatus(reference, "paid", payload);
      void recordAffiliateSale(reference).catch(() => {});
      void sendFBConversionPurchase(
        existing.name,
        existing.phone,
        existing.amount,
        existing.reference,
        "https://www.riquezaoculta.click/checkout/pagamento"
      ).catch(() => {});
      void sendOrderConfirmationWhatsApp(existing.phone, existing.name).catch(() => {});
      console.log("[Kambafy] Checkout atualizado para pago", { reference, duration: Date.now() - startTime });
    } else {
      // Checkout não existe (fluxo normal com Kambafy external) — criar diretamente como pago
      const now = new Date().toISOString();
      await insertCheckout({
        reference,
        name: customerName,
        phone: customerPhone,
        entity: "kambafy",
        paymentReference: reference,
        amount,
        status: "paid",
        providerPayload: payload,
        createdAt: now,
        updatedAt: now,
      });
      void sendFBConversionPurchase(
        customerName,
        customerPhone,
        amount,
        reference,
        "https://www.riquezaoculta.click/checkout/pagamento"
      ).catch(() => {});
      void sendOrderConfirmationWhatsApp(customerPhone, customerName).catch(() => {});
      console.log("[Kambafy] Novo checkout criado como pago", { reference, name: customerName, phone: customerPhone, amount, duration: Date.now() - startTime });
    }

    // Notificação Pushcut (fire-and-forget)
    void notifyPushcut(
      "💰 Nova Venda — 1M em Uma Semana",
      `${customerName} (${customerPhone || "sem tel"}) · ${amount > 0 ? `${amount} AOA` : "valor desconhecido"}\nRef: ${reference}`
    );

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error("[Kambafy] Erro não tratado", {
      error,
      duration: Date.now() - startTime,
      body: raw.slice(0, 500),
    });
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
