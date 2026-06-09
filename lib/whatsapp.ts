import { logError } from "./logger";

export interface WhatsAppMessageOptions {
  quotedMessageId?: string;
  mentionedIds?: string[];
}

/**
 * Envia uma mensagem de texto simples via WhatsApp usando o OpenWA.
 */
export async function sendWhatsAppMessage(
  phone: string,
  text: string,
  options?: WhatsAppMessageOptions
): Promise<boolean> {
  const apiUrl = process.env.OPENWA_API_URL;
  const apiKey = process.env.OPENWA_API_KEY;
  const sessionId = process.env.OPENWA_SESSION_ID;

  if (!apiUrl || !apiKey || !sessionId) {
    console.warn("[WhatsApp] Variáveis de ambiente OpenWA em falta. Mensagem não enviada.");
    return false;
  }

  // Limpar formatação do número (remover + e espaços)
  let cleanPhone = phone.replace(/\D/g, "");
  
  // Se for um número angolano de 9 dígitos sem o indicativo, adicionamos 244
  if (cleanPhone.length === 9) {
    cleanPhone = "244" + cleanPhone;
  }

  const chatId = `${cleanPhone}@c.us`;

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

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("[WhatsApp] Falha ao enviar mensagem:", data);
      return false;
    }

    console.log(`[WhatsApp] Mensagem enviada com sucesso para ${chatId}`);
    return true;
  } catch (error) {
    logError("WhatsApp", "Erro inesperado ao enviar mensagem", error);
    return false;
  }
}

/**
 * Envia mensagem de confirmação de encomenda (Pagamento Concluído)
 */
export async function sendOrderConfirmationWhatsApp(phone: string, name: string): Promise<boolean> {
  const text = `Olá *${name}*! 🎉

O teu pagamento do *Guia 1M em Uma Semana* foi confirmado com sucesso!
O teu acesso imediato está pronto. 

Podes aceder ao teu guia e ao bónus agora mesmo através deste link:
👉 https://www.riquezaoculta.click/sucesso

Também já podes entrar no nosso Grupo VIP! O link está na página de sucesso.

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
): Promise<boolean> {
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
export async function sendAbandonedCartWhatsApp(phone: string, name: string): Promise<boolean> {
  const text = `Olá *${name}*! Notámos que estiveste quase a garantir o teu acesso ao *Guia 1M em Uma Semana*, mas algo aconteceu com o pagamento Express. 😕

Não te preocupes, guardámos a tua reserva.
Queres tentar de novo ou tiveste alguma dificuldade com a aprovação no telemóvel?

Podes terminar a tua inscrição de forma segura aqui:
👉 https://www.riquezaoculta.click/checkout/pagamento

Responde a esta mensagem se precisares de ajuda ou de um método alternativo (como Referência ou Transferência).`;

  return sendWhatsAppMessage(phone, text);
}
