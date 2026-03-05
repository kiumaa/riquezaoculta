import { NextRequest, NextResponse } from "next/server";
import { createCharge } from "@/lib/providers/payment/kbagency";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";
import { insertCheckout } from "@/lib/storage";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(24)
});

function makeReference() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ROV2-${Date.now().toString(36).toUpperCase()}-${random}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rate = consumeRateLimit(`payment-session:${ip}`, 10, 60_000);

  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many payment attempts" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reference = makeReference();
  const charge = await createCharge({
    amount: 4500,
    reference,
    description: "Ebook Riqueza Oculta V2"
  });

  const now = new Date().toISOString();

  await insertCheckout({
    reference,
    name: parsed.data.name.trim(),
    phone: normalizePhone(parsed.data.phone),
    amount: charge.amount,
    entity: charge.entity,
    paymentReference: charge.paymentReference,
    status: "pending",
    providerPayload: charge.raw,
    createdAt: now,
    updatedAt: now
  });

  return NextResponse.json({
    reference,
    payment: {
      entity: charge.entity,
      reference: charge.paymentReference,
      amount: charge.amount,
      mode: charge.mode
    }
  });
}
