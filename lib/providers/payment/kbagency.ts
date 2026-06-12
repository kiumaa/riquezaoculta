import { env, isProd } from "@/lib/env";
import { logError } from "@/lib/logger";

// ── KB Agency · API Ultra (Unified Checkout) ─────────────────────────────────
// Doc: https://pay.kbagency.me/docs — endpoint unificado para Express + Referência.
//   POST /api/ultra/charge          { method: "express"|"reference", ... }
//   GET  /api/ultra/status/{reference}
// Auth: Authorization: Bearer <API_KEY>  (chave única de merchant)
const ULTRA_BASE = "https://pay.kbagency.me/api/ultra";

// Chave de merchant da API Ultra (única para Express e Referência).
function ultraKey() {
  return env.KB_AGENCY_API_KEY;
}

function appUrl() {
  return (env.NEXT_PUBLIC_APP_URL || "https://www.riquezaoculta.click").replace(/\/+$/, "");
}

function webhookUrl() {
  return `${appUrl()}/api/webhooks/kbagency`;
}

export type ChargeInput = {
  amount: number;
  reference: string;
  description: string;
};

export type ChargeOutput = {
  mode: "live" | "simulated";
  entity: string;
  paymentReference: string;
  paymentUrl?: string;
  amount: number;
  raw: unknown;
};

// Referência ATM / Internet Banking via API Ultra.
export async function createCharge(input: ChargeInput): Promise<ChargeOutput> {
  const key = ultraKey();

  if (!key) {
    const simulatedRef = `${Math.floor(100000000 + Math.random() * 899999999)}`;
    return {
      mode: "simulated",
      entity: "00999",
      paymentReference: simulatedRef,
      amount: input.amount,
      raw: { reason: "KB_AGENCY_API_KEY missing" }
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(`${ULTRA_BASE}/charge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        method: "reference",
        amount: input.amount,
        reference: input.reference,
        description: input.description,
        webhook_url: webhookUrl()
      }),
      signal: controller.signal
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`KB Ultra reference failed: ${res.status} ${text.slice(0, 300)}`);
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`KB Ultra reference non-JSON: ${text.slice(0, 150)}`);
    }

    const entity = data.entity;
    const paymentRef = data.payment_reference ?? data.reference;
    if (!entity || !paymentRef) {
      throw new Error(`KB Ultra reference unexpected response: ${text.slice(0, 300)}`);
    }

    return {
      mode: "live",
      entity: String(entity),
      // A referência ATM vem com espaços ("123 456 789"); guardamos só os dígitos.
      paymentReference: String(paymentRef).replace(/\s+/g, ""),
      amount: Number(data.amount ?? input.amount),
      raw: data
    };
  } catch (error) {
    logError("Payment", "Failed to create KB Ultra reference charge", error);

    const simulatedRef = `${Math.floor(100000000 + Math.random() * 899999999)}`;
    return {
      mode: "simulated",
      entity: "00999",
      paymentReference: simulatedRef,
      amount: input.amount,
      raw: { fallback: true, error: String(error) }
    };
  } finally {
    clearTimeout(timeout);
  }
}

export type ExpressChargeInput = {
  phone: string;
  amount: number;
  reference: string;
};

export type ExpressChargeOutput = {
  mode: "live" | "simulated";
  reference: string;
  amount: number;
};

// Multicaixa Express (push to phone) via API Ultra.
export async function createExpressCharge(input: ExpressChargeInput): Promise<ExpressChargeOutput> {
  const key = ultraKey();

  if (!key) {
    // Em produção, NUNCA fingir sucesso: sem chave não há cobrança real.
    if (isProd) {
      throw new Error("KB_AGENCY_API_KEY em falta em produção — pagamento Express indisponível");
    }
    // Dev local: modo simulado para testes.
    return { mode: "simulated", reference: input.reference, amount: input.amount };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  const body = JSON.stringify({
    method: "express",
    phone: input.phone,
    amount: input.amount,
    reference: input.reference,
    redirect_url: `${appUrl()}/checkout/pagamento?success=true&ref=${input.reference}`,
    description: "Guia 1M em Uma Semana",
    webhook_url: webhookUrl()
  });

  try {
    const res = await fetch(`${ULTRA_BASE}/charge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body,
      signal: controller.signal
    });

    const text = await res.text();
    console.log(`[KB Ultra Express] status=${res.status} body=${text.slice(0, 200)}`);

    if (!res.ok) {
      console.error(`[KB Ultra Express] API error ${res.status}:`, text.slice(0, 500));
      throw new Error(`KB Ultra express failed: ${res.status} ${text.slice(0, 300)}`);
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`KB Ultra express non-JSON: ${text.slice(0, 150)}`);
    }
    if (data.error) {
      throw new Error(`KB Ultra express error: ${String(data.error)} ${String(data.message ?? "")}`);
    }

    console.log(`[KB Ultra Express] Charge created OK for ref ${input.reference}`);
    return { mode: "live", reference: input.reference, amount: input.amount };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[KB Ultra Express] createExpressCharge failed: ${msg}`);
    logError("Payment", "Failed to create KB Ultra express charge", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Status unificado da API Ultra. Indexa pela NOSSA reference (a que enviámos no charge),
// para ambos os métodos (Express e Referência usam o mesmo endpoint).
export async function getChargeStatus(reference: string) {
  const key = ultraKey();

  if (!key) {
    return {
      mode: "simulated" as const,
      status: "pending" as const,
      raw: { reason: "KB_AGENCY_API_KEY missing" }
    };
  }

  try {
    const res = await fetch(`${ULTRA_BASE}/status/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json"
      }
    });

    const text = await res.text();

    if (!res.ok) {
      console.error(`[KB Ultra Status] ${res.status} for ${reference}:`, text.slice(0, 200));
      throw new Error(`Status lookup failed: ${res.status}`);
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`KB Ultra status non-JSON: ${text.slice(0, 120)}`);
    }

    const nested = data.data as Record<string, unknown> | undefined;
    const rawStatus = String(data.status ?? nested?.status ?? "pending").toLowerCase();
    const normalized =
      rawStatus === "paid" || rawStatus === "success" || rawStatus === "completed"
        ? "paid"
        : rawStatus === "failed" || rawStatus === "cancelled" || rawStatus === "expired"
          ? "failed"
          : "pending";

    return {
      mode: "live" as const,
      status: normalized,
      raw: data
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[KB Ultra Status] check failed for ${reference}: ${msg}`);
    logError("Payment", `Failed to check status for ${reference}`, error);
    return {
      mode: "live" as const,
      status: "pending" as const,
      raw: { error: msg }
    };
  }
}

// ── Webhooks (payload Ultra: { event, data: { reference, status, ... } }) ─────
export function extractWebhookReference(payload: Record<string, unknown>) {
  const direct = payload.reference;
  if (typeof direct === "string") return direct;

  const tx = payload.transaction_id;
  if (typeof tx === "string") return tx;

  const order = payload.order_id;
  if (typeof order === "string") return order;

  const nested = payload.data as Record<string, unknown> | undefined;
  if (nested && typeof nested.reference === "string") return nested.reference;

  return null;
}

export function isWebhookPaid(payload: Record<string, unknown>) {
  const nested = payload.data as Record<string, unknown> | undefined;
  const event = String(payload.event ?? "").toLowerCase();
  const status = String(payload.status ?? nested?.status ?? "").toLowerCase();

  return (
    event === "payment.success" ||
    status === "success" ||
    status === "paid" ||
    status === "completed"
  );
}
