import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getPagedAffiliates } from "@/lib/storage";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));

  try {
    const data = await getPagedAffiliates(page, limit);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar afiliados" }, { status: 500 });
  }
}

