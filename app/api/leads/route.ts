import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { insertLead } from "@/lib/storage";
import { normalizePhone } from "@/lib/phone";
import { env } from "@/lib/env";
import { z } from "zod";
import crypto from "crypto";

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

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

async function sendFBConversionLead(name: string, phone: string, eventSourceUrl?: string) {
  const pixelId = env.FACEBOOK_PIXEL_ID;
  const accessToken = env.FACEBOOK_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return;

  const payload = {
    data: [{
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_id: crypto.randomUUID(),
      event_source_url: eventSourceUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://riquezaoculta.click",
      action_source: "website",
      user_data: {
        ph: sha256(phone),
        fn: sha256(name.split(" ")[0]),
      },
      custom_data: {
        value: 0.00,
        currency: "AOA"
      }
    }]
  };

  await fetch(
    `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  ).catch(() => { }); // non-blocking — never break the lead flow
}

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
