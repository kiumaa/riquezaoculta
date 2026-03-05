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
  amount: number;
  raw: unknown;
};

export async function createCharge(input: ChargeInput): Promise<ChargeOutput> {
  const key = env.KB_AGENCY_API_KEY;

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

  const isExpress = key.startsWith("sk_express_");
  const endpoint = isExpress
    ? "https://pay.kbagency.me/api/apiexpress/charge"
    : "https://pay.kbagency.me/api/payments";

  const payload = isExpress
    ? {
        amount: input.amount,
        reference: input.reference,
        description: input.description
      }
    : {
        amount: input.amount,
        reference: input.reference,
        description: input.description,
        redirect_url: `${env.NEXT_PUBLIC_APP_URL}/checkout/pagamento?success=true&ref=${input.reference}`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/oferta?cancel=true&ref=${input.reference}`
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

    const paymentData = isExpress ? data.payment_data : data;

    if (!paymentData?.entity || !paymentData?.reference) {
      throw new Error("KB Agency returned incomplete payment data");
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

export async function getChargeStatus(reference: string) {
  const key = env.KB_AGENCY_API_KEY;

  if (!key) {
    return {
      mode: "simulated" as const,
      status: "pending" as const,
      raw: { reason: "KB_AGENCY_API_KEY missing" }
    };
  }

  const isExpress = key.startsWith("sk_express_");
  const endpoint = isExpress
    ? `https://pay.kbagency.me/api/apiexpress/status/${reference}`
    : `https://pay.kbagency.me/api/payments/${reference}`;

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
    logError("Payment", `Failed to check status for ${reference}`, error);
    return {
      mode: "live" as const,
      status: "pending" as const,
      raw: { error: String(error) }
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
