import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getMemberContent, insertMemberContent } from "@/lib/storage";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await getMemberContent();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { module: mod, title, description, type, fileUrl, videoUrl, ordem } = body;
  if (!mod || !title || !type) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const id = await insertMemberContent({ module: mod, title, description, type, fileUrl, videoUrl, ordem: ordem ?? 0, isActive: true });
  return NextResponse.json({ ok: true, id });
}
