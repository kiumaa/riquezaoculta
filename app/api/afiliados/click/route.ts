import { NextRequest, NextResponse } from "next/server";
import { findAffiliateByToken, recordAffiliateClick } from "@/lib/storage";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // Silencioso
  }

  const { token } = body as Record<string, string>;
  if (!token) return NextResponse.json({ ok: true });

  const affiliate = await findAffiliateByToken(token);
  if (!affiliate || affiliate.status !== "active") {
    return NextResponse.json({ ok: true }); // Silencioso — não revelar se existe
  }

  await recordAffiliateClick(token).catch(() => {});

  return NextResponse.json({ ok: true });
}
