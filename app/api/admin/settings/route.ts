import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSettings, getSocialProofEnabled, getWhatsAppGroupLink, updateSettings, upsertSetting } from "@/lib/storage";
import { z } from "zod";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [s, whatsappGroupLink, socialProofEnabled] = await Promise.all([
    getSettings(), getWhatsAppGroupLink(), getSocialProofEnabled()
  ]);
  return NextResponse.json({ ...s, whatsappGroupLink, socialProofEnabled });
}

const schema = z.object({
  priceOriginal:      z.number().int().positive().optional(),
  pricePromo:         z.number().int().positive().optional(),
  priceQuiz:          z.number().int().positive().optional(),
  priceOrderBump:     z.number().int().positive().optional(),
  whatsappGroupLink:  z.string().url().optional(),
  socialProofEnabled: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { whatsappGroupLink, socialProofEnabled, ...priceData } = parsed.data;

  await Promise.all([
    Object.keys(priceData).length > 0 ? updateSettings(priceData) : Promise.resolve(),
    whatsappGroupLink !== undefined ? upsertSetting("whatsapp_group_link", whatsappGroupLink) : Promise.resolve(),
    socialProofEnabled !== undefined ? upsertSetting("social_proof_enabled", String(socialProofEnabled)) : Promise.resolve(),
  ]);

  const [s, waLink, sp] = await Promise.all([getSettings(), getWhatsAppGroupLink(), getSocialProofEnabled()]);
  return NextResponse.json({ ...s, whatsappGroupLink: waLink, socialProofEnabled: sp });
}
