import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { seedDefaultFunnelContent } from "@/lib/storage";

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await seedDefaultFunnelContent();
  return NextResponse.json({ ok: true });
}
