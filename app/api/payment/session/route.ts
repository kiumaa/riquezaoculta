import { NextRequest, NextResponse } from "next/server";
import { createCharge, createExpressCharge } from "@/lib/providers/payment/kbagency";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";
import { getSettings, insertCheckout } from "@/lib/storage";
import { sendPaymentReferenceSms } from "@/lib/providers/sms/bulkgate";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(24),
  method: z.enum(["express", "reference"]).default("reference"),
  expressPhone: z.string().min(9).max(15).optional()
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
  const now = new Date().toISOString();
  const { pricePromo } = await getSettings();

  if (parsed.data.method === "express") {
    if (!parsed.data.expressPhone) {
      return NextResponse.json({ error: "expressPhone is required for Express payments" }, { status: 400 });
    }

    const charge = await createExpressCharge({
      phone: parsed.data.expressPhone,
      amount: pricePromo,
      reference
    });

    await insertCheckout({
      reference,
      name: parsed.data.name.trim(),
      phone: normalizePhone(parsed.data.phone),
      amount: charge.amount,
      entity: "express",
      paymentReference: charge.reference,
      status: "pending",
      providerPayload: { method: "express", mode: charge.mode },
      createdAt: now,
      updatedAt: now
    });

    return NextResponse.json({
      reference,
      method: "express",
      payment: {
        reference: charge.reference,
        amount: charge.amount,
        mode: charge.mode
      }
    });
  }

  // Reference method
  const charge = await createCharge({
    amount: pricePromo,
    reference,
    description: "Ebook Riqueza Oculta V2"
  });

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

  // Send reference via SMS so user has it on their phone when going to ATM
  sendPaymentReferenceSms(
    normalizePhone(parsed.data.phone),
    parsed.data.name.trim(),
    charge.entity,
    charge.paymentReference,
    charge.amount
  ).catch(() => {});

  return NextResponse.json({
    reference,
    method: "reference",
    payment: {
      entity: charge.entity,
      reference: charge.paymentReference,
      paymentUrl: charge.paymentUrl,
      amount: charge.amount,
      mode: charge.mode
    }
  });
}
