import { NextRequest, NextResponse } from "next/server";
import { findAffiliateByToken, getPayoutRequestsByAffiliate } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const affiliate = await findAffiliateByToken(token);
  if (!affiliate || affiliate.status === "suspended") {
    return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });
  }

  const payouts = await getPayoutRequestsByAffiliate(affiliate.id);

  return NextResponse.json({
    id: affiliate.id,
    name: affiliate.name,
    phone: affiliate.phone,
    email: affiliate.email,
    iban: affiliate.iban,
    status: affiliate.status,
    commissionRate: affiliate.commissionRate,
    totalClicks: affiliate.totalClicks,
    totalSales: affiliate.totalSales,
    totalEarnings: affiliate.totalEarnings,
    currentBalance: affiliate.currentBalance,
    createdAt: affiliate.createdAt,
    payouts,
  });
}
