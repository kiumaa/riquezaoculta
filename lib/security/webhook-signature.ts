import crypto from "crypto";

export function verifyWebhookSignature(
  rawBody: string,
  secret: string,
  receivedSignature: string | null
) {
  if (!receivedSignature || !secret) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expected = `sha256=${digest}`;

  const a = Buffer.from(expected);
  const b = Buffer.from(receivedSignature);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
