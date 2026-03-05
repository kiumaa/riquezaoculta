import { NextRequest, NextResponse } from "next/server";
import { env, isProd } from "@/lib/env";
import { extractWebhookReference, isWebhookPaid } from "@/lib/providers/payment/kbagency";
import { verifyWebhookSignature } from "@/lib/security/webhook-signature";
import { updateCheckoutStatus } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-kbagency-signature") || req.headers.get("x-signature");

  if (env.KB_AGENCY_WEBHOOK_SECRET) {
    const valid = verifyWebhookSignature(raw, env.KB_AGENCY_WEBHOOK_SECRET, signature);
    if (!valid) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } else if (isProd) {
    return NextResponse.json({ error: "webhook secret required in production" }, { status: 500 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const reference = extractWebhookReference(payload);

  if (!reference) {
    return NextResponse.json({ error: "missing reference" }, { status: 400 });
  }

  if (isWebhookPaid(payload)) {
    await updateCheckoutStatus(reference, "paid", payload);
  }

  return NextResponse.json({ received: true });
}
