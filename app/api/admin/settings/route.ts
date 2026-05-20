import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSettings, getWhatsAppGroupLink, updateSettings, upsertSetting } from "@/lib/storage";
import { z } from "zod";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [s, whatsappGroupLink] = await Promise.all([getSettings(), getWhatsAppGroupLink()]);
  return NextResponse.json({ ...s, whatsappGroupLink });
}

const schema = z.object({
  priceOriginal:     z.number().int().positive().optional(),
  pricePromo:        z.number().int().positive().optional(),
  priceQuiz:         z.number().int().positive().optional(),
  whatsappGroupLink: z.string().url().optional(),
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

  const { whatsappGroupLink, ...priceData } = parsed.data;

  await Promise.all([
    Object.keys(priceData).length > 0 ? updateSettings(priceData) : Promise.resolve(),
    whatsappGroupLink !== undefined ? upsertSetting("whatsapp_group_link", whatsappGroupLink) : Promise.resolve(),
  ]);

  const [s, waLink] = await Promise.all([getSettings(), getWhatsAppGroupLink()]);
  return NextResponse.json({ ...s, whatsappGroupLink: waLink });
}
