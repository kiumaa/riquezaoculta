import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";

const BULKGATE_URL = "https://portal.bulkgate.com/api/1.0/simple/transactional";

async function sendSms(phone: string, text: string) {
  if (!env.BULKGATE_APP_ID || !env.BULKGATE_APP_TOKEN) {
    return { success: false, reason: "BulkGate credentials missing" };
  }

  const payload = {
    application_id: env.BULKGATE_APP_ID,
    application_token: env.BULKGATE_APP_TOKEN,
    number: normalizePhone(phone),
    text
  };

  const res = await fetch(BULKGATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    const reason = data?.error ?? data?.data?.error ?? JSON.stringify(data);
    return { success: false, reason };
  }

  return { success: true, data };
}

export async function sendAccessSms(phone: string, accessCode: string) {
  return sendSms(phone, `Teu codigo de acesso: ${accessCode}. Usa em ${env.NEXT_PUBLIC_APP_URL}/acesso`);
}

export async function sendRecoveryMessage(phone: string, name: string, offerUrl: string) {
  const firstName = name.split(" ")[0];
  const text = `${firstName} o teu acesso ao Guia Riqueza Oculta continua reservado. Completa a compra agora e garante o teu lugar em: ${offerUrl}\nEsperamos por ti!`;
  return sendSms(phone, text);
}

export async function sendPaymentReferenceSms(
  phone: string,
  name: string,
  entity: string | undefined,
  reference: string,
  amount: number
) {
  const firstName = name.split(" ")[0];
  const entityPart = entity ? `Entidade ${entity} | ` : "";
  const text = `${firstName} a tua referencia Riqueza Oculta: ${entityPart}Ref ${reference} | Valor ${amount} Kz. Paga no ATM ou Internet Banking.`;
  return sendSms(phone, text).catch(() => ({ success: false, reason: "SMS failed silently" }));
}
