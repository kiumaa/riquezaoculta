import { env } from "@/lib/env";
import { logError } from "@/lib/logger";

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

export async function createCharge(input: ChargeInput): Promise<ChargeOutput> {
  const key = env.KB_AGENCY_API_KEY; // APIExpress key (Referência/ATM)

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

  const endpoint = "https://pay.kbagency.me/api/apiexpress/charge";

  const payload = {
    amount: input.amount,
    reference: input.reference,
    description: input.description
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`KB Agency charge failed: ${res.status} ${JSON.stringify(data)}`);
    }

    const paymentData = data.payment_data || data;
    if (!paymentData?.entity || !paymentData?.reference) {
      throw new Error(`KB Agency returned unexpected response: ${JSON.stringify(data)}`);
    }

    return {
      mode: "live",
      entity: String(paymentData.entity),
      paymentReference: String(paymentData.reference),
      amount: Number(paymentData.amount ?? input.amount),
      raw: data
    };
  } catch (error) {
    logError("Payment", "Failed to create KB charge", error);

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

export async function createExpressCharge(input: ExpressChargeInput): Promise<ExpressChargeOutput> {
  const key = env.KB_API_EXPRESS_KEY;

  if (!key) {
    return { mode: "simulated", reference: input.reference, amount: input.amount };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  const body = JSON.stringify({
    phone: input.phone,
    amount: input.amount,
    reference: input.reference,
    redirect_url: `${env.NEXT_PUBLIC_APP_URL}/checkout/pagamento?success=true&ref=${input.reference}`,
    description: "Ebook Riqueza Oculta V2"
  });

  try {
    const res = await fetch("https://pay.kbagency.me/api/apix/charge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body,
      signal: controller.signal
    });

    const text = await res.text();
    console.log(`[KB Express] Response: status=${res.status} redirected=${res.redirected} url=${res.url} body=${text.slice(0, 200)}`);

    if (!res.ok) {
      console.error(`[KB Express] API error ${res.status}:`, text.slice(0, 500));
      throw new Error(`KB Express charge failed: ${res.status} ${text.slice(0, 300)}`);
    }

    let responseJson: Record<string, unknown>;
    try { responseJson = JSON.parse(text); } catch {
      console.error(`[KB Express] Non-JSON response (${res.status}) redirected=${res.redirected} finalUrl=${res.url}:`, text.slice(0, 300));
      throw new Error(`KB Express non-JSON response: ${text.slice(0, 100)}`);
    }
    if (responseJson.error) {
      console.error(`[KB Express] Error in response:`, responseJson);
      throw new Error(`KB Express error: ${String(responseJson.error)} ${String(responseJson.message ?? "")}`);
    }

    console.log(`[KB Express] Charge created OK for ref ${input.reference}`);
    return { mode: "live", reference: input.reference, amount: input.amount };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[KB Express] createExpressCharge failed: ${msg}`);
    logError("Payment", "Failed to create Express charge", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getChargeStatus(reference: string, method: "express" | "reference" = "reference") {
  const key = method === "express" ? env.KB_API_EXPRESS_KEY : env.KB_AGENCY_API_KEY;

  if (!key) {
    return {
      mode: "simulated" as const,
      status: "pending" as const,
      raw: { reason: `${method === "express" ? "KB_AGENCY_API_KEY" : "KB_API_EXPRESS_KEY"} missing` }
    };
  }

  // MCX Express: /api/apix/status | Reference: /api/apiexpress/status
  const endpoint = method === "express"
    ? `https://pay.kbagency.me/api/apix/status/${reference}`
    : `https://pay.kbagency.me/api/apiexpress/status/${reference}`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`[KB Status] ${method} ${res.status} for ${reference}:`, JSON.stringify(data).slice(0, 300));
      throw new Error(`Status lookup failed: ${res.status}`);
    }

    const rawStatus = String(data.status || data.data?.status || "pending").toLowerCase();
    const normalized =
      rawStatus === "success" || rawStatus === "paid" || rawStatus === "completed"
        ? "paid"
        : rawStatus === "failed" || rawStatus === "cancelled"
          ? "failed"
          : "pending";

    return {
      mode: "live" as const,
      status: normalized,
      raw: data
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[KB Status] ${method} check failed for ${reference}: ${msg}`);
    logError("Payment", `Failed to check status for ${reference}`, error);
    return {
      mode: "live" as const,
      status: "pending" as const,
      raw: { error: msg }
    };
  }
}

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
