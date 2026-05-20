import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getPayoutRequests } from "@/lib/storage";
import type { PayoutStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as PayoutStatus | null;

  try {
    const data = await getPayoutRequests(status ?? undefined);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar levantamentos" }, { status: 500 });
  }
}
