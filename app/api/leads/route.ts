import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { insertLead } from "@/lib/storage";
import { normalizePhone } from "@/lib/phone";
import { env } from "@/lib/env";
import { sendFBConversionLead } from "@/lib/capi";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(7).max(24),
  source: z.string().min(2).max(50),
  journey: z.array(z.object({
    page: z.string(),
    url: z.string(),
    timestamp: z.string(),
    duration: z.number().optional()
  })).optional()
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rate = consumeRateLimit(`lead:${ip}`, 20, 60_000);

  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const normalized = normalizePhone(parsed.data.phone);

  await insertLead({
    name: parsed.data.name.trim(),
    phone: normalized,
    source: parsed.data.source,
    journey: parsed.data.journey
  });

  // Fire server-side Lead event to Facebook Conversions API (non-blocking)
  const referer = req.headers.get("referer") ?? undefined;
  sendFBConversionLead(parsed.data.name.trim(), normalized, referer);

  return NextResponse.json({ success: true });
}
