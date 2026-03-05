import fs from "fs/promises";
import path from "path";
import { checkouts, leads } from "@/db/schema";
import { db } from "@/lib/db";
import { logError } from "@/lib/logger";
import type { CheckoutRecord, CheckoutStatus, LeadPayload } from "@/lib/types";
import { desc, eq } from "drizzle-orm";

const fallbackPath = path.join(process.cwd(), "data", "runtime.json");

type RuntimeData = {
  leads: LeadPayload[];
  checkouts: CheckoutRecord[];
};

async function ensureFallbackFile() {
  try {
    await fs.access(fallbackPath);
  } catch {
    const empty: RuntimeData = { leads: [], checkouts: [] };
    await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
    await fs.writeFile(fallbackPath, JSON.stringify(empty, null, 2), "utf8");
  }
}

async function readFallback(): Promise<RuntimeData> {
  await ensureFallbackFile();
  const raw = await fs.readFile(fallbackPath, "utf8");
  return JSON.parse(raw) as RuntimeData;
}

async function writeFallback(data: RuntimeData) {
  await fs.writeFile(fallbackPath, JSON.stringify(data, null, 2), "utf8");
}

export async function insertLead(payload: LeadPayload) {
  if (db) {
    await db.insert(leads).values(payload);
    return;
  }

  const data = await readFallback();
  data.leads.push(payload);
  await writeFallback(data);
}

export async function insertCheckout(record: CheckoutRecord) {
  if (db) {
    await db.insert(checkouts).values({
      reference: record.reference,
      name: record.name,
      phone: record.phone,
      entity: record.entity,
      paymentReference: record.paymentReference,
      amount: record.amount,
      status: record.status,
      providerPayload: record.providerPayload,
      updatedAt: new Date(record.updatedAt)
    });
    return;
  }

  const data = await readFallback();
  data.checkouts.unshift(record);
  await writeFallback(data);
}

export async function findCheckout(reference: string): Promise<CheckoutRecord | null> {
  if (db) {
    const rows = await db
      .select()
      .from(checkouts)
      .where(eq(checkouts.reference, reference))
      .orderBy(desc(checkouts.createdAt))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      reference: row.reference,
      name: row.name,
      phone: row.phone,
      entity: row.entity,
      paymentReference: row.paymentReference,
      amount: row.amount,
      status: row.status,
      providerPayload: row.providerPayload,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    };
  }

  const data = await readFallback();
  return data.checkouts.find(item => item.reference === reference) ?? null;
}

export async function updateCheckoutStatus(reference: string, status: CheckoutStatus, payload?: unknown) {
  if (db) {
    try {
      await db
        .update(checkouts)
        .set({
          status,
          providerPayload: payload,
          updatedAt: new Date()
        })
        .where(eq(checkouts.reference, reference));
    } catch (error) {
      logError("Storage", "Failed to update checkout status", error);
    }
    return;
  }

  const data = await readFallback();
  data.checkouts = data.checkouts.map(item => {
    if (item.reference !== reference) return item;
    return {
      ...item,
      status,
      providerPayload: payload ?? item.providerPayload,
      updatedAt: new Date().toISOString()
    };
  });
  await writeFallback(data);
}
