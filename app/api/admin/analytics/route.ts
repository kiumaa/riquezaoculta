import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import {
  getDailyStats,
  getLeadCount,
  getProfileDistribution,
  getRevenue,
  getSourceDistribution,
  getStatusDistribution,
} from "@/lib/storage";
import { db } from "@/lib/db";
import { checkouts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(7, Number(searchParams.get("days") ?? 30)));

  const [dailyStats, profileDist, sourceDist, statusDist, totalLeads, revenue] = await Promise.all([
    getDailyStats(days),
    getProfileDistribution(),
    getSourceDistribution(),
    getStatusDistribution(),
    getLeadCount(),
    getRevenue(),
  ]);

  // Total paid and checkout counts
  let totalPaid = 0;
  let totalCheckouts = 0;
  if (db) {
    const [paidRow, totalRow] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(checkouts).where(eq(checkouts.status, "paid")),
      db.select({ count: sql<number>`count(*)::int` }).from(checkouts),
    ]);
    totalPaid = paidRow[0]?.count ?? 0;
    totalCheckouts = totalRow[0]?.count ?? 0;
  }

  return NextResponse.json({
    dailyStats,
    profileDistribution: profileDist,
    sourceDistribution: sourceDist,
    statusDistribution: statusDist,
    summary: {
      totalLeads,
      totalCheckouts,
      totalPaid,
      revenue,
      checkoutRate: totalLeads > 0 ? Math.round((totalCheckouts / totalLeads) * 100) : 0,
      paymentRate: totalCheckouts > 0 ? Math.round((totalPaid / totalCheckouts) * 100) : 0,
    },
  });
}
