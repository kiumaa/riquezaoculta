import { NextRequest, NextResponse } from "next/server";
import { env, isProd } from "@/lib/env";
import { getChargeStatus } from "@/lib/providers/payment/kbagency";
import { findCheckout, markCheckoutPaid, recordAffiliateSale, updateCheckoutStatus } from "@/lib/storage";
import { sendFBConversionPurchase, extractMetaMatch } from "@/lib/capi";
import { sendOrderConfirmation } from "@/lib/communication-service";

// A KB Agency (API Ultra) faz whitelist por IP sul-africano. Esta rota consulta o
// status na KB, por isso é fixada à região cpt1 (Cape Town).
export const preferredRegion = "cpt1";
export const dynamic = "force-dynamic";

// Express payments get grace period (10 minutes backend) for user to confirm on app
// UX shows 5 minutes to create urgency, but backend allows 10 minutes
const EXPRESS_GRACE_PERIOD_MS = 10 * 60 * 1000; // 10 minutes backend

// Reference payments expire after 24 hours (gives time to go to ATM or use Internet Banking)
const REFERENCE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  const { reference } = await context.params;
  const record = await findCheckout(reference);

  if (!record) {
    return NextResponse.json({ error: "Reference not found" }, { status: 404 });
  }

  if (record.status === "pending") {
    const method = record.entity === "express" ? "express" : "reference";
    const createdAt = new Date(record.createdAt).getTime();
    const elapsed = Date.now() - createdAt;
    
    // Check if reference has expired (24 hours for reference payments)
    if (method === "reference" && elapsed > REFERENCE_EXPIRY_MS) {
      console.log(`[Status] Reference ${reference} expired after ${Math.round(elapsed/1000)}s`);
      await updateCheckoutStatus(reference, "failed", { reason: "Reference expired", expiredAfter: elapsed });
    } else {
      // API Ultra indexa o status pela NOSSA reference (a enviada no charge), para ambos os métodos.
      const provider = await getChargeStatus(reference);

      // For Express: only mark as failed after grace period
      if (provider.status === "paid") {
        // Transição atómica — side-effects só para quem confirma a transição (anti-duplicação).
        if (await markCheckoutPaid(reference, provider.raw)) {
          void recordAffiliateSale(reference).catch(() => {});
          void sendFBConversionPurchase(
            record.name,
            record.phone,
            record.amount,
            record.reference,
            "https://www.riquezaoculta.click/checkout/pagamento",
            extractMetaMatch(record.providerPayload)
          ).catch(() => {});
          void sendOrderConfirmation(record.phone, record.name, { reference: record.reference }).catch(() => {});
        }
      } else if (provider.status === "failed") {
        // For Express: wait grace period before marking as failed
        if (method === "express" && elapsed < EXPRESS_GRACE_PERIOD_MS) {
          console.log(`[Status] Express payment ${reference} in grace period (${Math.round(elapsed/1000)}s)`);
          // Keep as pending during grace period
        } else {
          await updateCheckoutStatus(reference, "failed", provider.raw);
        }
      } else if (!isProd && !env.KB_AGENCY_API_KEY) {
        if (elapsed >= 20_000 && await markCheckoutPaid(reference, { simulatedAutoPaid: true })) {
          void recordAffiliateSale(reference).catch(() => {});
          void sendFBConversionPurchase(
            record.name,
            record.phone,
            record.amount,
            record.reference,
            "https://www.riquezaoculta.click/checkout/pagamento",
            extractMetaMatch(record.providerPayload)
          ).catch(() => {});
          void sendOrderConfirmation(record.phone, record.name, { reference: record.reference }).catch(() => {});
        }
      }
    }
  }

  const refreshed = await findCheckout(reference);

  // A KB devolve "message" com o motivo da falha — surfaçamos ao cliente.
  const payload = refreshed?.providerPayload as Record<string, unknown> | undefined;
  const message = typeof payload?.message === "string" ? payload.message : undefined;

  return NextResponse.json({
    reference,
    status: refreshed?.status ?? "pending",
    ...(message && refreshed?.status === "failed" ? { message } : {})
  });
}
