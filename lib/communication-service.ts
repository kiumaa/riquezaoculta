import {
  sendOrderConfirmationWhatsApp,
  sendReferenceReminderWhatsApp,
  sendAbandonedCartWhatsApp
} from "@/lib/whatsapp";
import { sendRecoveryMessage, sendReferenceReminderSms } from "@/lib/providers/sms/bulkgate";
import { insertCommunicationLog, getWhatsAppGroupLink } from "@/lib/storage";
import { consumeRateLimit } from "@/lib/rate-limit";
import type { CommunicationChannel, CommunicationTrigger, CommunicationType } from "@/lib/types";

/**
 * Alerta o operador (Pushcut) quando um envio falha — para que falhas
 * silenciosas (ex: sessão WhatsApp caída) sejam notadas na hora.
 * Throttled a 1 alerta / 5 min para não inundar durante uma queda.
 */
function alertFailure(channel: CommunicationChannel, type: CommunicationType, phone: string, reason?: string) {
  const url = process.env.PUSHCUT_URL;
  if (!url) return;
  const { allowed } = consumeRateLimit("comm-fail-alert", 1, 300_000);
  if (!allowed) return;
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "⚠️ Falha de envio (WhatsApp/SMS)",
      text: `${channel.toUpperCase()} "${type}" para ${phone} falhou: ${reason ?? "motivo desconhecido"}. Verifica a ligação da sessão WhatsApp no admin.`
    })
  }).catch(() => {});
}

/**
 * Serviço central de comunicação com o cliente.
 *
 * Envolve os emissores brutos (WhatsApp/SMS) e regista CADA envio na tabela
 * communicationLogs, para que cron, webhooks e ações manuais do admin partilhem
 * o mesmo caminho e deixem um rasto de auditoria por cliente.
 *
 * O logging é fail-safe (ver insertCommunicationLog), por isso uma falha a
 * gravar nunca interrompe o envio nem o fluxo de pagamento.
 */

export type CommunicationContext = {
  reference?: string | null;
  leadId?: number | null;
  trigger?: CommunicationTrigger;
};

const LABELS: Record<CommunicationType, string> = {
  confirmation: "Confirmação de pagamento",
  reminder_1h: "Lembrete de referência — 1h",
  reminder_6h: "Lembrete de referência — 6h",
  abandoned: "Recuperação de carrinho",
  recovery: "Recuperação (SMS)"
};

async function record(
  phone: string,
  type: CommunicationType,
  ok: boolean,
  ctx: CommunicationContext,
  channel: CommunicationChannel = "whatsapp",
  reason?: string
) {
  await insertCommunicationLog({
    reference: ctx.reference ?? null,
    leadId: ctx.leadId ?? null,
    phone,
    type,
    channel,
    status: ok ? "sent" : "failed",
    trigger: ctx.trigger ?? "auto",
    messageText: LABELS[type],
    failureReason: ok ? null : (reason ?? "Envio devolveu falha")
  });
  if (!ok) alertFailure(channel, type, phone, reason);
}

function smsReason(res: { success: boolean; reason?: string }): string | undefined {
  return res.success ? undefined : (res.reason ?? "SMS falhou");
}

export async function sendOrderConfirmation(
  phone: string,
  name: string,
  ctx: CommunicationContext = {}
): Promise<boolean> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.riquezaoculta.click";
  const accessUrl = ctx.reference
    ? `${base}/acesso?ref=${encodeURIComponent(ctx.reference)}`
    : `${base}/acesso`;
  const vipLink = await getWhatsAppGroupLink().catch(() => undefined);
  const r = await sendOrderConfirmationWhatsApp(phone, name, { accessUrl, vipLink: vipLink || undefined });
  await record(phone, "confirmation", r.ok, ctx, "whatsapp", r.reason);
  return r.ok;
}

export async function sendReferenceReminder(
  phone: string,
  name: string,
  entity: string,
  reference: string,
  amount: number,
  timeframe: "1h" | "6h",
  ctx: CommunicationContext = {}
): Promise<boolean> {
  const r = await sendReferenceReminderWhatsApp(phone, name, entity, reference, amount, timeframe);
  await record(phone, timeframe === "1h" ? "reminder_1h" : "reminder_6h", r.ok, ctx, "whatsapp", r.reason);
  return r.ok;
}

export async function sendAbandonedCart(
  phone: string,
  name: string,
  ctx: CommunicationContext = {}
): Promise<boolean> {
  const r = await sendAbandonedCartWhatsApp(phone, name);
  await record(phone, "abandoned", r.ok, ctx, "whatsapp", r.reason);
  return r.ok;
}

/** SMS de recuperação (BulkGate) — registado como channel "sms", type "recovery". */
export async function sendRecoverySms(
  phone: string,
  name: string,
  offerUrl: string,
  ctx: CommunicationContext = {}
): Promise<boolean> {
  const res = await sendRecoveryMessage(phone, name, offerUrl);
  await record(phone, "recovery", res.success, ctx, "sms", smsReason(res));
  return res.success;
}

/** Lembrete de referência por SMS (BulkGate) — registado como channel "sms". */
export async function sendReferenceReminderSmsLogged(
  phone: string,
  name: string,
  entity: string,
  reference: string,
  amount: number,
  timeframe: "1h" | "6h",
  ctx: CommunicationContext = {}
): Promise<boolean> {
  const res = await sendReferenceReminderSms(phone, name, entity, reference, amount, timeframe);
  await record(phone, timeframe === "1h" ? "reminder_1h" : "reminder_6h", res.success, ctx, "sms", smsReason(res));
  return res.success;
}
