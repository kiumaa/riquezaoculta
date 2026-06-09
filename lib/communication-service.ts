import {
  sendOrderConfirmationWhatsApp,
  sendReferenceReminderWhatsApp,
  sendAbandonedCartWhatsApp
} from "@/lib/whatsapp";
import { insertCommunicationLog } from "@/lib/storage";
import type { CommunicationTrigger, CommunicationType } from "@/lib/types";

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
  channel: "whatsapp" | "sms" = "whatsapp"
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
    failureReason: ok ? null : "Envio devolveu falha (ver logs do provedor)"
  });
}

export async function sendOrderConfirmation(
  phone: string,
  name: string,
  ctx: CommunicationContext = {}
): Promise<boolean> {
  const ok = await sendOrderConfirmationWhatsApp(phone, name);
  await record(phone, "confirmation", ok, ctx);
  return ok;
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
  const ok = await sendReferenceReminderWhatsApp(phone, name, entity, reference, amount, timeframe);
  await record(phone, timeframe === "1h" ? "reminder_1h" : "reminder_6h", ok, ctx);
  return ok;
}

export async function sendAbandonedCart(
  phone: string,
  name: string,
  ctx: CommunicationContext = {}
): Promise<boolean> {
  const ok = await sendAbandonedCartWhatsApp(phone, name);
  await record(phone, "abandoned", ok, ctx);
  return ok;
}
