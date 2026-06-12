 import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkouts } from "@/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import { updateCheckoutStatus, markCheckoutPaid, recordAffiliateSale } from "@/lib/storage";
import { getChargeStatus } from "@/lib/providers/payment/kbagency";
import { sendFBConversionPurchase } from "@/lib/capi";
import { sendReferenceReminder, sendAbandonedCart, sendReferenceReminderSmsLogged, sendOrderConfirmation } from "@/lib/communication-service";
import { env, isProd } from "@/lib/env";

// A KB Agency (API Ultra) faz whitelist por IP sul-africano. Este cron consulta o
// status na KB, por isso é fixado à região cpt1 (Cape Town).
export const preferredRegion = "cpt1";
export const dynamic = "force-dynamic";

// Processa checkouts criados nas últimas 48 horas (para pegar referências antigas)
const MAX_AGE_HOURS = 48;

// Reference payments expire after 24 hours (gives time to go to ATM)
const REFERENCE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Janelas de tempo para envio de lembretes SMS (em minutos)
const REMINDER_1H_MIN = 55;  // 55 minutos (janela: 55-75min)
const REMINDER_1H_MAX = 75;
const REMINDER_6H_MIN = 350; // 5h50min (janela: 350-390min)
const REMINDER_6H_MAX = 390;

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  // Auth fail-closed. A Vercel Cron envia automaticamente `Authorization: Bearer ${CRON_SECRET}`
  // quando a env var CRON_SECRET está definida no projeto. Sem o secret correto, recusamos —
  // exceto em desenvolvimento local (sem secret) para permitir testes manuais.
  const authHeader = req.headers.get("authorization");
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret) {
    if (isProd) {
      console.error("[Cron Recover] CRON_SECRET em falta — endpoint trancado em produção. Define CRON_SECRET na Vercel.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // dev local sem secret: permitir
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    console.error("[Cron Recover] Database not available");
    return NextResponse.json({ error: "Database not available" }, { status: 500 });
  }

  console.log("[Cron Recover] Starting recovery job", new Date().toISOString());

  try {
    // Calcular data limite (48 horas atrás)
    const cutoffDate = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);
    
    // Buscar checkouts pendentes criados nas últimas 48 horas
    const pendingCheckouts = await db
      .select()
      .from(checkouts)
      .where(
        and(
          eq(checkouts.status, "pending"),
          gt(checkouts.createdAt, cutoffDate)
        )
      )
      .orderBy(sql`${checkouts.createdAt} DESC`)
      .limit(50);

    console.log(`[Cron Recover] Found ${pendingCheckouts.length} pending checkouts`);

    const results = {
      processed: 0,
      updated: 0,
      failed: 0,
      smsSent: { "1h": 0, "6h": 0 },
      waSent: { "1h": 0, "6h": 0, abandoned: 0 },
      errors: [] as string[]
    };

    for (const checkout of pendingCheckouts) {
      results.processed++;
      
      try {
        // Determinar método de pagamento
        const method: "express" | "reference" = 
          checkout.entity === "express" ? "express" : "reference";
        
        const createdAt = new Date(checkout.createdAt).getTime();
        const elapsedMs = Date.now() - createdAt;
        const elapsedMin = Math.floor(elapsedMs / (60 * 1000));

        console.log(`[Cron Recover] Checking status for ${checkout.reference} (${method}, ${elapsedMin}min ago)`);

        // Check if reference payment has expired (24 hours)
        if (method === "reference" && elapsedMs > REFERENCE_EXPIRY_MS) {
          console.log(`[Cron Recover] Reference ${checkout.reference} expired after ${Math.round(elapsedMs/1000)}s`);
          await updateCheckoutStatus(checkout.reference, "failed", { reason: "Reference expired", expiredAfter: elapsedMs });
          results.updated++;
          continue;
        }

        // Enviar lembretes SMS para referências (não express)
        if (method === "reference") {
          // Lembrete 1h: entre 55-75 minutos
          if (elapsedMin >= REMINDER_1H_MIN && elapsedMin < REMINDER_1H_MAX) {
            console.log(`[Cron Recover] Sending 1h reminder for ${checkout.reference}`);
            const sms1h = await sendReferenceReminderSmsLogged(
              checkout.phone,
              checkout.name,
              checkout.entity,
              checkout.paymentReference,
              checkout.amount,
              "1h",
              { reference: checkout.reference }
            );
            const wa1h = await sendReferenceReminder(
              checkout.phone,
              checkout.name,
              checkout.entity,
              checkout.paymentReference,
              checkout.amount,
              "1h",
              { reference: checkout.reference }
            );
            if (sms1h) results.smsSent["1h"]++;
            if (wa1h) results.waSent["1h"]++;
          }
          
          // Lembrete 6h: entre 350-390 minutos (~6 horas)
          if (elapsedMin >= REMINDER_6H_MIN && elapsedMin < REMINDER_6H_MAX) {
            console.log(`[Cron Recover] Sending 6h reminder for ${checkout.reference}`);
            const sms6h = await sendReferenceReminderSmsLogged(
              checkout.phone,
              checkout.name,
              checkout.entity,
              checkout.paymentReference,
              checkout.amount,
              "6h",
              { reference: checkout.reference }
            );
            const wa6h = await sendReferenceReminder(
              checkout.phone,
              checkout.name,
              checkout.entity,
              checkout.paymentReference,
              checkout.amount,
              "6h",
              { reference: checkout.reference }
            );
            if (sms6h) results.smsSent["6h"]++;
            if (wa6h) results.waSent["6h"]++;
          }
        }

        // Consultar status no gateway
        const statusResult = await getChargeStatus(checkout.reference);

        if (statusResult.status === "paid") {
          // Transição atómica — se o cron for o primeiro a confirmar, dispara TODOS os
          // side-effects (afiliado + CAPI + confirmação), tal como o webhook/status fazem.
          if (await markCheckoutPaid(checkout.reference, statusResult.raw)) {
            void recordAffiliateSale(checkout.reference).catch(() => {});
            void sendFBConversionPurchase(
              checkout.name,
              checkout.phone,
              checkout.amount,
              checkout.reference,
              "https://www.riquezaoculta.click/checkout/pagamento"
            ).catch(() => {});
            void sendOrderConfirmation(checkout.phone, checkout.name, { reference: checkout.reference }).catch(() => {});
            console.log(`[Cron Recover] Updated ${checkout.reference} to PAID`);
          }
          results.updated++;

        } else if (statusResult.status === "failed") {
          // Verificar se é Express e ainda está dentro do grace period
          if (method === "express") {
            const gracePeriod = 10 * 60 * 1000; // 10 minutos
            
            if (elapsedMs < gracePeriod) {
              console.log(`[Cron Recover] Express ${checkout.reference} still in grace period (${Math.round(elapsedMs/1000)}s)`);
              continue;
            }
            
            // Check if we already sent the recovery message
            const payload = (checkout.providerPayload as Record<string, unknown>) || {};
            if (!payload.recoverySent) {
              console.log(`[Cron Recover] Sending abandoned cart WhatsApp for Express ${checkout.reference} (Failed)`);
              const abOk = await sendAbandonedCart(checkout.phone, checkout.name, { reference: checkout.reference });
              await updateCheckoutStatus(checkout.reference, "failed", { ...(statusResult.raw as object), recoverySent: true });
              results.updated++;
              if (abOk) results.waSent.abandoned++;
              continue;
            }
          }
          
          await updateCheckoutStatus(checkout.reference, "failed", statusResult.raw);
          console.log(`[Cron Recover] Updated ${checkout.reference} to FAILED`);
          results.updated++;
          
        } else {
          console.log(`[Cron Recover] ${checkout.reference} still pending`);
          // Express abandoned cart check (15 mins)
          if (method === "express" && elapsedMin >= 15) {
             const payload = (checkout.providerPayload as Record<string, unknown>) || {};
             if (!payload.recoverySent) {
               console.log(`[Cron Recover] Sending abandoned cart WhatsApp for pending Express ${checkout.reference}`);
               const abOk = await sendAbandonedCart(checkout.phone, checkout.name, { reference: checkout.reference });
               await updateCheckoutStatus(checkout.reference, checkout.status, { recoverySent: true });
               results.updated++;
               if (abOk) results.waSent.abandoned++;
             }
          }
        }

        // Pequeno delay para não sobrecarregar a API do gateway
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`[Cron Recover] Error processing ${checkout.reference}:`, error);
        results.failed++;
        results.errors.push(`${checkout.reference}: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron Recover] Completed in ${duration}ms`, results);

    return NextResponse.json({
      success: true,
      duration,
      ...results
    });

  } catch (error) {
    console.error("[Cron Recover] Fatal error:", error);
    return NextResponse.json(
      { error: "Recovery job failed", details: error instanceof Error ? error.message : 'unknown' },
      { status: 500 }
    );
  }
}

// Também suportar POST para testes manuais
export const POST = GET;
