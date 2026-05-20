import { NextResponse } from "next/server";
import { getSettings, getWhatsAppGroupLink } from "@/lib/storage";

export async function GET() {
  const [settings, whatsappLink] = await Promise.all([
    getSettings(),
    getWhatsAppGroupLink()
  ]);
  
  return NextResponse.json({
    ...settings,
    whatsappLink
  });
}
