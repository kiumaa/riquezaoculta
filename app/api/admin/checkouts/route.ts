import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getCheckouts } from "@/lib/storage";
import { db } from "@/lib/db";
import { checkouts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  console.log("[Admin Checkouts] Request received");
  
  // Check admin auth
  const isAdminUser = await isAdmin();
  console.log("[Admin Checkouts] Is admin:", isAdminUser);
  
  if (!isAdminUser) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  console.log("[Admin Checkouts] Params:", { page, limit });
  console.log("[Admin Checkouts] Database connected:", !!db);

  try {
    const result = await getCheckouts(page, limit);
    
    // Calcular estatísticas globais reais
    const stats = {
      totalRevenue: 0,
      totalPaid: 0,
      totalPending: 0,
      revenueQuiz: 0,
      revenueEbook: 0,
      salesQuiz: 0,
      salesEbook: 0,
    };

    if (db) {
      const paidRows = await db
        .select({
          amount: checkouts.amount,
          providerPayload: checkouts.providerPayload,
        })
        .from(checkouts)
        .where(eq(checkouts.status, "paid"));

      const [pendingRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(checkouts)
        .where(eq(checkouts.status, "pending"));

      stats.totalPaid = paidRows.length;
      stats.totalPending = pendingRow?.count ?? 0;
      
      for (const row of paidRows) {
        const amt = row.amount;
        stats.totalRevenue += amt;
        const payload = row.providerPayload as Record<string, unknown> | null;
        const isQuiz = payload?.product === "quiz" || amt === 1000;
        if (isQuiz) {
          stats.revenueQuiz += amt;
          stats.salesQuiz += 1;
        } else {
          stats.revenueEbook += amt;
          stats.salesEbook += 1;
        }
      }
    }

    console.log("[Admin Checkouts] Result:", { 
      total: result.total, 
      page: result.page, 
      dataLength: result.data.length,
      stats
    });
    
    return NextResponse.json({
      ...result,
      stats
    });
  } catch (error) {
    console.error("[Admin Checkouts] Error:", error);
    return NextResponse.json({ 
      error: "Erro ao buscar checkouts", 
      details: error instanceof Error ? error.message : "Unknown error",
      dbConnected: !!db
    }, { status: 500 });
  }
}
