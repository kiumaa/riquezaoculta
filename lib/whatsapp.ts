import { logError } from "./logger";

export interface WhatsAppMessageOptions {
  quotedMessageId?: string;
  mentionedIds?: string[];
}

/**
 * Base da API OpenWA, normalizada. Aceita o env com ou sem "/api" e com ou sem
 * barra final — garante sempre ".../api" (resiliente a má configuração do env).
 */
function openwaBase(): string | null {
  const raw = process.env.OPENWA_API_URL;
  if (!raw) return null;
  let url = raw.trim().replace(/\/+$/, "");
  if (!/\/api$/.test(url)) url += "/api";
  return url;
}

/**
 * Verifica se um número está registado no WhatsApp (read-only, não envia nada).
 * Devolve true/false, ou null se não foi possível determinar.
 */
export async function checkWhatsAppNumber(phone: string): Promise<boolean | null> {
  const apiUrl = openwaBase();
  const apiKey = process.env.OPENWA_API_KEY;
  const sessionId = process.env.OPENWA_SESSION_ID;
  if (!apiUrl || !apiKey || !sessionId) return null;

  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length === 9) cleanPhone = "244" + cleanPhone;

  try {
    const res = await fetch(`${apiUrl}/sessions/${sessionId}/contacts/check/${cleanPhone}`, {
      headers: { "X-API-Key": apiKey, "Accept": "application/json" }
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data && typeof data.exists === "boolean" ? data.exists : null;
  } catch {
    return null;
  }
}

/**
 * Envia uma mensagem de texto simples via WhatsApp usando o OpenWA.
 */
export async function sendWhatsAppMessage(
  phone: string,
  text: string,
  options?: WhatsAppMessageOptions
): Promise<{ ok: boolean; reason?: string }> {
  const apiUrl = openwaBase();
  const apiKey = process.env.OPENWA_API_KEY;
  const sessionId = process.env.OPENWA_SESSION_ID;

  if (!apiUrl || !apiKey || !sessionId) {
    console.warn("[WhatsApp] Variáveis de ambiente OpenWA em falta. Mensagem não enviada.");
    return { ok: false, reason: "Variáveis OpenWA em falta" };
  }

  // Limpar formatação do número (remover + e espaços)
  let cleanPhone = phone.replace(/\D/g, "");
  
  // Se for um número angolano de 9 dígitos sem o indicativo, adicionamos 244
  if (cleanPhone.length === 9) {
    cleanPhone = "244" + cleanPhone;
  }

  const chatId = `${cleanPhone}@c.us`;

  // Pré-verificação: o número está registado no WhatsApp? Evita o 500 do OpenWA
  // e regista um motivo claro (ex: cliente sem WhatsApp) em vez de falha genérica.
  const registered = await checkWhatsAppNumber(cleanPhone);
  if (registered === false) {
    return { ok: false, reason: "Número não está registado no WhatsApp" };
  }

  try {
    const response = await fetch(`${apiUrl}/sessions/${sessionId}/messages/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify({
        chatId,
        text,
        options
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      console.error("[WhatsApp] Falha ao enviar mensagem:", data);
      const reason = (data && (data.error || data.message)) || `HTTP ${response.status}`;
      return { ok: false, reason: String(reason).slice(0, 200) };
    }

    console.log(`[WhatsApp] Mensagem enviada com sucesso para ${chatId}`);
    return { ok: true };
  } catch (error) {
    logError("WhatsApp", "Erro inesperado ao enviar mensagem", error);
    return { ok: false, reason: error instanceof Error ? error.message.slice(0, 200) : "Erro de rede" };
  }
}

/**
 * Estado da sessão WhatsApp no OpenWA (para o indicador no admin).
 * connected=true só quando a sessão está "ready" (a enviar).
 */
export async function getWhatsAppSessionStatus(): Promise<{ connected: boolean; status: string; phone?: string }> {
  const apiUrl = openwaBase();
  const apiKey = process.env.OPENWA_API_KEY;
  const sessionId = process.env.OPENWA_SESSION_ID;

  if (!apiUrl || !apiKey || !sessionId) {
    return { connected: false, status: "not_configured" };
  }

  try {
    const res = await fetch(`${apiUrl}/sessions/${sessionId}`, {
      headers: { "X-API-Key": apiKey, "Accept": "application/json" }
    });
    if (!res.ok) return { connected: false, status: `http_${res.status}` };
    const data = await res.json().catch(() => ({}));
    const status = String(data?.status ?? "unknown");
    return { connected: status === "ready", status, phone: data?.phone };
  } catch {
    return { connected: false, status: "error" };
  }
}

/**
 * Envia mensagem de confirmação de encomenda (Pagamento Concluído)
 */
export async function sendOrderConfirmationWhatsApp(
  phone: string,
  name: string,
  opts?: { accessUrl?: string; vipLink?: string }
): Promise<{ ok: boolean; reason?: string }> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.riquezaoculta.click";
  const accessUrl = opts?.accessUrl || `${base}/acesso`;
  const vipPart = opts?.vipLink
    ? `\n\nEntra também no nosso *Grupo VIP* no WhatsApp:\n👉 ${opts.vipLink}`
    : "";

  const text = `Olá *${name}*! 🎉

O teu pagamento do *Guia 1M em Uma Semana* foi confirmado com sucesso!
O teu acesso imediato está pronto.

Acede e descarrega o teu guia aqui (link pessoal):
👉 ${accessUrl}${vipPart}

Qualquer dúvida, responde a esta mensagem. Parabéns pela decisão! 🚀`;

  return sendWhatsAppMessage(phone, text);
}

/**
 * Envia lembrete de Referência Multicaixa
 */
export async function sendReferenceReminderWhatsApp(
  phone: string, 
  name: string, 
  entity: string, 
  reference: string, 
  amount: number,
  timeframe: "1h" | "6h"
): Promise<{ ok: boolean; reason?: string }> {
  const intro = timeframe === "1h" 
    ? `Olá *${name}*, reparámos que ainda não concluíste o pagamento do teu Guia 1M em Uma Semana.`
    : `Olá *${name}*, a tua referência para o Guia 1M em Uma Semana está quase a expirar!`;

  const text = `${intro}

Para não perderes o teu acesso, vai a um Multicaixa ou usa o teu Multicaixa Express e faz o pagamento de Pagamentos por Referência:

🏢 Entidade: *${entity}*
🔢 Referência: *${reference}*
💰 Valor: *${amount} Kz*

Assim que pagares, o sistema liberta automaticamente o teu acesso.
Se precisares de ajuda com o pagamento, avisa!`;

  return sendWhatsAppMessage(phone, text);
}

/**
 * Envia mensagem de recuperação de Carrinho Abandonado (Pagamento Express Pendente/Falhado)
 */
export async function sendAbandonedCartWhatsApp(phone: string, name: string): Promise<{ ok: boolean; reason?: string }> {
  const text = `Olá *${name}*! Notámos que estiveste quase a garantir o teu acesso ao *Guia 1M em Uma Semana*, mas algo aconteceu com o pagamento Express. 😕

Não te preocupes, guardámos a tua reserva.
Queres tentar de novo ou tiveste alguma dificuldade com a aprovação no telemóvel?

Podes terminar a tua inscrição de forma segura aqui:
👉 https://www.riquezaoculta.click/checkout/pagamento

Responde a esta mensagem se precisares de ajuda ou de um método alternativo (como Referência ou Transferência).`;

  return sendWhatsAppMessage(phone, text);
}
