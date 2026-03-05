import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";

const BULKGATE_URL = "https://portal.bulkgate.com/api/1.0/simple/transactional";

export async function sendAccessSms(phone: string, accessCode: string) {
  if (!env.BULKGATE_APP_ID || !env.BULKGATE_APP_TOKEN) {
    return { success: false, reason: "BulkGate credentials missing" };
  }

  const payload = {
    application_id: env.BULKGATE_APP_ID,
    application_token: env.BULKGATE_APP_TOKEN,
    number: normalizePhone(phone),
    text: `Teu codigo de acesso: ${accessCode}. Usa em ${env.NEXT_PUBLIC_APP_URL}/acesso`
  };

  const res = await fetch(BULKGATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, reason: data?.error ?? "SMS error" };
  }

  return { success: true, data };
}
