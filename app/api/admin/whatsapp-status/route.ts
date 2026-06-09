import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getWhatsAppSessionStatus } from "@/lib/whatsapp";

// GET /api/admin/whatsapp-status — estado da sessão OpenWA para o indicador do admin.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = await getWhatsAppSessionStatus();
  return NextResponse.json(status);
}
