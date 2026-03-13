import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getFunnelContent, upsertFunnelContent } from "@/lib/storage";

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const pageType = searchParams.get("page") ?? undefined;
  const items = await getFunnelContent(pageType);
  return NextResponse.json(items);
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { pageType, sectionKey, content, metadata } = await req.json();
  if (!pageType || !sectionKey) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  await upsertFunnelContent(pageType, sectionKey, content ?? "", metadata);
  return NextResponse.json({ ok: true });
}
