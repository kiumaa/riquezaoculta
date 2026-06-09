import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkouts } from "@/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import { updateCheckoutStatus } from "@/lib/storage";
import { getChargeStatus } from "@/lib/providers/payment/kbagency";
import { sendReferenceReminderSms } from "@/lib/providers/sms/bulkgate";
import { sendFBConversionPurchase } from "@/lib/capi";
import { sendReferenceReminder, sendAbandonedCart } from "@/lib/communication-service";

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
  
  // Verificar autorização via header (Vercel Cron envia um header específico ou pode usar um token)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Se não tem CRON_SECRET configurado, verificar se é chamada interna da Vercel
    const isVercelCron = req.headers.get("x-vercel-signature") !== null;
    if (!isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
            await sendReferenceReminderSms(
              checkout.phone,
              checkout.name,
              checkout.entity,
              checkout.paymentReference,
              checkout.amount,
              "1h"
            );
            await sendReferenceReminder(
              checkout.phone,
              checkout.name,
              checkout.entity,
              checkout.paymentReference,
              checkout.amount,
              "1h",
              { reference: checkout.reference }
            );
            results.smsSent["1h"]++;
            results.waSent["1h"]++;
          }
          
          // Lembrete 6h: entre 350-390 minutos (~6 horas)
          if (elapsedMin >= REMINDER_6H_MIN && elapsedMin < REMINDER_6H_MAX) {
            console.log(`[Cron Recover] Sending 6h reminder for ${checkout.reference}`);
            await sendReferenceReminderSms(
              checkout.phone,
              checkout.name,
              checkout.entity,
              checkout.paymentReference,
              checkout.amount,
              "6h"
            );
            await sendReferenceReminder(
              checkout.phone,
              checkout.name,
              checkout.entity,
              checkout.paymentReference,
              checkout.amount,
              "6h",
              { reference: checkout.reference }
            );
            results.smsSent["6h"]++;
            results.waSent["6h"]++;
          }
        }

        // Consultar status no gateway
        const statusResult = await getChargeStatus(checkout.reference, method);

        if (statusResult.status === "paid") {
          // Atualizar para pago
          await updateCheckoutStatus(checkout.reference, "paid", statusResult.raw);
          void sendFBConversionPurchase(
            checkout.name,
            checkout.phone,
            checkout.amount,
            checkout.reference,
            "https://www.riquezaoculta.click/checkout/pagamento"
          ).catch(() => {});
          console.log(`[Cron Recover] Updated ${checkout.reference} to PAID`);
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
              await sendAbandonedCart(checkout.phone, checkout.name, { reference: checkout.reference });
              await updateCheckoutStatus(checkout.reference, "failed", { ...(statusResult.raw as object), recoverySent: true });
              results.updated++;
              results.waSent.abandoned++;
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
               await sendAbandonedCart(checkout.phone, checkout.name, { reference: checkout.reference });
               await updateCheckoutStatus(checkout.reference, checkout.status, { recoverySent: true });
               results.updated++;
               results.waSent.abandoned++;
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
