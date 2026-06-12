import crypto from "crypto";

// KB Agency assina o webhook com hash_hmac('sha256', payload, secret) em HEX PURO
// (sem prefixo "sha256="), no header X-KB-Signature.
// Ref: https://pay.kbagency.me/docs → Webhooks → Validação de Assinatura.
export function verifyWebhookSignature(
  rawBody: string,
  secret: string,
  receivedSignature: string | null
) {
  if (!receivedSignature || !secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(receivedSignature.trim());

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
