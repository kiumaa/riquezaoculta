import { env } from "@/lib/env";
import crypto from "crypto";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function getCleanPhone(phone: string): string {
  // Apenas dígitos
  return phone.replace(/\D/g, "");
}

function getCleanFirstName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[0] || "";
}

export async function sendFBConversionLead(
  name: string,
  phone: string,
  eventSourceUrl?: string
) {
  const pixelId = env.FACEBOOK_PIXEL_ID;
  const accessToken = env.FACEBOOK_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    console.log("[CAPI] Evento Lead ignorado por falta de configuracao do Facebook Pixel/Access Token.");
    return;
  }

  const cleanPhone = getCleanPhone(phone);
  const cleanName = getCleanFirstName(name);

  const payload = {
    data: [{
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `lead_${cleanPhone}_${Math.floor(Date.now() / 1000)}`,
      event_source_url: eventSourceUrl ?? "https://www.riquezaoculta.click/simulador/quiz",
      action_source: "website",
      user_data: {
        ph: [sha256(cleanPhone)],
        fn: [sha256(cleanName)],
      },
      custom_data: {
        value: 0.00,
        currency: "AOA"
      }
    }]
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );
    const data = await res.json();
    console.log("[CAPI] Evento Lead enviado para o Facebook:", data);
  } catch (err) {
    console.error("[CAPI] Erro ao enviar evento Lead para o Facebook:", err);
  }
}

export async function sendFBConversionPurchase(
  name: string,
  phone: string,
  amount: number,
  reference: string,
  eventSourceUrl?: string
) {
  const pixelId = env.FACEBOOK_PIXEL_ID;
  const accessToken = env.FACEBOOK_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    console.log("[CAPI] Evento Purchase ignorado por falta de configuracao do Facebook Pixel/Access Token.");
    return;
  }

  const cleanPhone = getCleanPhone(phone);
  const cleanName = getCleanFirstName(name);

  const payload = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `purchase_${reference}`,
      event_source_url: eventSourceUrl ?? "https://www.riquezaoculta.click/checkout/pagamento",
      action_source: "website",
      user_data: {
        ph: [sha256(cleanPhone)],
        fn: [sha256(cleanName)],
      },
      custom_data: {
        value: amount,
        currency: "AOA",
        content_type: "product",
        contents: [
          {
            id: amount === 1000 ? "quiz_report" : "ebook_riqueza_oculta",
            quantity: 1,
            item_price: amount
          }
        ]
      }
    }]
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );
    const data = await res.json();
    console.log("[CAPI] Evento Purchase enviado para o Facebook:", data);
  } catch (err) {
    console.error("[CAPI] Erro ao enviar evento Purchase para o Facebook:", err);
  }
}
