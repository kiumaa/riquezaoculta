import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getCheckouts, getLeads } from "@/lib/storage";

export const dynamic = "force-dynamic";

interface HealthCheck {
  timestamp: string;
  environment: string;
  database: {
    configured: boolean;
    connected: boolean;
    error: string | null;
    testQuery?: unknown;
  };
  checkouts: {
    count: number;
    error: string | null;
    sample?: unknown;
  };
  leads: {
    count: number;
    error: string | null;
  };
}

export async function GET() {
  const checks: HealthCheck = {
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: {
      configured: !!env.DATABASE_URL,
      connected: false,
      error: null
    },
    checkouts: {
      count: 0,
      error: null
    },
    leads: {
      count: 0,
      error: null
    }
  };

  // Test database connection
  if (db) {
    try {
      // Try a simple query
      const testResult = await db.execute("SELECT 1 as test");
      checks.database.connected = true;
      checks.database.testQuery = testResult;
    } catch (error) {
      checks.database.error = error instanceof Error ? error.message : "Unknown error";
    }
  }

  // Get actual counts
  try {
    const checkoutResult = await getCheckouts(1, 1);
    checks.checkouts.count = checkoutResult.total;
    checks.checkouts.sample = checkoutResult.data[0] || null;
  } catch (error) {
    checks.checkouts.error = error instanceof Error ? error.message : "Unknown error";
  }

  try {
    const leadsResult = await getLeads(1, 1);
    checks.leads.count = leadsResult.total;
  } catch (error) {
    checks.leads.error = error instanceof Error ? error.message : "Unknown error";
  }

  const statusCode = checks.database.connected ? 200 : 503;
  
  return NextResponse.json(checks, { status: statusCode });
}
