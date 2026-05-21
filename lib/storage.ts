import fs from "fs/promises";
import path from "path";
import { affiliates, checkouts, funnelContent, leads, memberContent, payoutRequests, quizSubmissions, settings } from "@/db/schema";
import type { AffiliateInsert, FunnelContentInsert, MemberContentInsert, PayoutRequestInsert, QuizSubmissionInsert } from "@/db/schema";
import { db } from "@/lib/db";
import { logError } from "@/lib/logger";
import type { AffiliateRecord, AffiliateStatus, CheckoutRecord, CheckoutStatus, FunnelContentRecord, LeadPayload, LeadStatus, MemberContentRecord, PayoutRequestRecord, PayoutStatus, QuizSubmissionRecord } from "@/lib/types";
import { asc, desc, eq, sql } from "drizzle-orm";

const fallbackPath = path.join(process.cwd(), "data", "runtime.json");

type Settings = {
  priceOriginal: number;
  pricePromo: number;
  priceQuiz: number;
};

const SETTINGS_DEFAULTS: Settings = { priceOriginal: 7500, pricePromo: 4500, priceQuiz: 1000 };

// In-memory cache for settings (60 seconds TTL)
let settingsCache: { data: Settings; expires: number } | null = null;
const SETTINGS_CACHE_TTL = 60000;

type RuntimeData = {
  leads: LeadPayload[];
  checkouts: CheckoutRecord[];
  settings?: Settings;
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
    const base = {
      reference: record.reference,
      name: record.name,
      phone: record.phone,
      entity: record.entity,
      paymentReference: record.paymentReference,
      amount: record.amount,
      status: record.status,
      providerPayload: record.providerPayload,
      updatedAt: new Date(record.updatedAt)
    };
    try {
      await db.insert(checkouts).values({ ...base, affiliateToken: record.affiliateToken ?? null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("affiliate_token") || msg.includes("column")) {
        // Column not yet migrated — insert without it so checkouts are never lost
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.insert(checkouts).values(base as any);
      } else {
        throw err;
      }
    }
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
      affiliateToken: row.affiliateToken ?? null,
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

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};

export async function getLeads(page = 1, limit = 20): Promise<PaginatedResult<LeadPayload & { id: number; createdAt: string }>> {
  const offset = (page - 1) * limit;

  if (db) {
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(leads)
    ]);
    return {
      data: rows.map(r => ({
        name: r.name,
        phone: r.phone,
        email: r.email,
        province: r.province,
        source: r.source,
        quizProfile: r.quizProfile,
        status: r.status,
        notes: r.notes,
        journey: r.journey as LeadPayload["journey"],
        id: r.id,
        createdAt: r.createdAt.toISOString()
      })),
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  const raw = await readFallback();
  const all = [...raw.leads].reverse();
  const slice = all.slice(offset, offset + limit);
  return {
    data: slice.map((l, i) => ({ ...l, id: i, createdAt: (l as unknown as { createdAt: string }).createdAt ?? new Date().toISOString() })),
    total: all.length,
    page,
    totalPages: Math.ceil(all.length / limit)
  };
}

export async function getCheckouts(page = 1, limit = 20): Promise<PaginatedResult<CheckoutRecord>> {
  const offset = (page - 1) * limit;

  if (db) {
    const [rows, [{ count }]] = await Promise.all([
      db.select().from(checkouts).orderBy(desc(checkouts.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(checkouts)
    ]);
    return {
      data: rows.map(r => ({
        reference: r.reference,
        name: r.name,
        phone: r.phone,
        entity: r.entity,
        paymentReference: r.paymentReference,
        amount: r.amount,
        status: r.status,
        providerPayload: r.providerPayload,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      })),
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  const raw = await readFallback();
  const all = raw.checkouts;
  const slice = all.slice(offset, offset + limit);
  return {
    data: slice,
    total: all.length,
    page,
    totalPages: Math.ceil(all.length / limit)
  };
}

export async function getSettings(): Promise<Settings> {
  // Check cache first
  if (settingsCache && Date.now() < settingsCache.expires) {
    return settingsCache.data;
  }

  let result: Settings;

  if (db) {
    const rows = await db.select().from(settings);
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    result = {
      priceOriginal: map.priceOriginal ? Number(map.priceOriginal) : SETTINGS_DEFAULTS.priceOriginal,
      pricePromo: map.pricePromo ? Number(map.pricePromo) : SETTINGS_DEFAULTS.pricePromo,
      priceQuiz: map.priceQuiz ? Number(map.priceQuiz) : SETTINGS_DEFAULTS.priceQuiz
    };
  } else {
    const data = await readFallback();
    result = { ...SETTINGS_DEFAULTS, ...(data.settings ?? {}) };
  }

  // Update cache
  settingsCache = { data: result, expires: Date.now() + SETTINGS_CACHE_TTL };
  return result;
}

export function invalidateSettingsCache(): void {
  settingsCache = null;
  console.log("[Settings] Cache invalidated");
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  if (db) {
    for (const [key, value] of Object.entries(patch)) {
      await db
        .insert(settings)
        .values({ key, value: String(value) })
        .onConflictDoUpdate({ target: settings.key, set: { value: String(value) } });
    }
  } else {
    const data = await readFallback();
    data.settings = { ...SETTINGS_DEFAULTS, ...(data.settings ?? {}), ...patch };
    await writeFallback(data);
  }
  // Invalidate cache so new settings are immediately available
  invalidateSettingsCache();
}

export async function clearAllLeads(): Promise<number> {
  if (db) {
    const rows = await db.delete(leads).returning({ id: leads.id });
    return rows.length;
  }
  const data = await readFallback();
  const count = data.leads.length;
  data.leads = [];
  await writeFallback(data);
  return count;
}

export async function clearAllCheckouts(): Promise<number> {
  if (db) {
    const rows = await db.delete(checkouts).returning({ id: checkouts.id });
    return rows.length;
  }
  const data = await readFallback();
  const count = data.checkouts.length;
  data.checkouts = [];
  await writeFallback(data);
  return count;
}

// ── Lead helpers ─────────────────────────────────────────────────────────────

export async function updateLeadStatus(id: number, status: LeadStatus) {
  if (!db) return;
  await db.update(leads).set({ status }).where(eq(leads.id, id));
}

export async function updateLeadNotes(id: number, notes: string) {
  if (!db) return;
  await db.update(leads).set({ notes }).where(eq(leads.id, id));
}

export async function getLeadIdByPhone(phone: string): Promise<number | null> {
  if (!db) return null;
  const result = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.phone, phone))
    .orderBy(desc(leads.createdAt))
    .limit(1);
  return result[0]?.id ?? null;
}

export async function updateLeadQuizProfile(id: number, profile: string) {
  if (!db) return;
  await db.update(leads).set({ quizProfile: profile }).where(eq(leads.id, id));
}

export async function getLeadCount(): Promise<number> {
  if (!db) return 0;
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(leads);
  return count;
}

export async function getRecentLeads(limit = 10) {
  if (!db) return [];
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    province: r.province,
    source: r.source,
    quizProfile: r.quizProfile,
    status: r.status,
    notes: r.notes,
    journey: r.journey,
    createdAt: r.createdAt.toISOString()
  }));
}

// ── Quiz submissions ──────────────────────────────────────────────────────────

export async function insertQuizSubmission(payload: QuizSubmissionInsert) {
  if (!db) return;
  await db.insert(quizSubmissions).values(payload);
}

export async function getQuizSubmissions(): Promise<QuizSubmissionRecord[]> {
  if (!db) return [];
  const rows = await db.select().from(quizSubmissions).orderBy(desc(quizSubmissions.createdAt));
  return rows.map(r => ({
    id: r.id,
    leadId: r.leadId,
    phone: r.phone,
    answers: r.answers as Record<string, string>,
    scores: r.scores as Record<string, number>,
    profile: r.profile,
    profileTitle: r.profileTitle,
    createdAt: r.createdAt.toISOString()
  }));
}

export async function getQuizSubmissionByPhone(phone: string): Promise<QuizSubmissionRecord | null> {
  if (!db) return null;
  const rows = await db
    .select()
    .from(quizSubmissions)
    .where(eq(quizSubmissions.phone, phone))
    .orderBy(desc(quizSubmissions.createdAt))
    .limit(1);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id,
    leadId: r.leadId,
    phone: r.phone,
    answers: r.answers as Record<string, string>,
    scores: r.scores as Record<string, number>,
    profile: r.profile,
    profileTitle: r.profileTitle,
    createdAt: r.createdAt.toISOString()
  };
}

export async function getQuizSubmissionCount(): Promise<number> {
  if (!db) return 0;
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(quizSubmissions);
  return count;
}

export async function getProfileDistribution(): Promise<{ profile: string; count: number }[]> {
  if (!db) return [];
  const rows = await db
    .select({ profile: quizSubmissions.profile, count: sql<number>`count(*)::int` })
    .from(quizSubmissions)
    .groupBy(quizSubmissions.profile)
    .orderBy(desc(sql`count(*)`));
  return rows as { profile: string; count: number }[];
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getDailyStats(days = 7): Promise<{ date: string; leads: number; checkouts: number; paid: number }[]> {
  if (!db) return [];
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [leadsRow, checkoutsRow, paidRow] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(leads).where(
        sql`${leads.createdAt} >= ${start} AND ${leads.createdAt} < ${end}`
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(checkouts).where(
        sql`${checkouts.createdAt} >= ${start} AND ${checkouts.createdAt} < ${end}`
      ),
      db.select({ count: sql<number>`count(*)::int` }).from(checkouts).where(
        sql`${checkouts.createdAt} >= ${start} AND ${checkouts.createdAt} < ${end} AND ${checkouts.status} = 'paid'`
      ),
    ]);

    result.push({
      date: start.toISOString().slice(0, 10),
      leads: leadsRow[0]?.count ?? 0,
      checkouts: checkoutsRow[0]?.count ?? 0,
      paid: paidRow[0]?.count ?? 0,
    });
  }
  return result;
}

export async function getRevenue(): Promise<number> {
  if (!db) return 0;
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(amount), 0)::int` })
    .from(checkouts)
    .where(eq(checkouts.status, "paid"));
  return total ?? 0;
}

export async function getSourceDistribution(): Promise<{ source: string; count: number }[]> {
  if (!db) return [];
  const rows = await db
    .select({ source: leads.source, count: sql<number>`count(*)::int` })
    .from(leads)
    .groupBy(leads.source)
    .orderBy(desc(sql`count(*)`));
  return rows as { source: string; count: number }[];
}

export async function getStatusDistribution(): Promise<{ status: string; count: number }[]> {
  if (!db) return [];
  const rows = await db
    .select({ status: leads.status, count: sql<number>`count(*)::int` })
    .from(leads)
    .groupBy(leads.status)
    .orderBy(desc(sql`count(*)`));
  return rows as { status: string; count: number }[];
}

export async function getProvinceDistribution(): Promise<{ province: string; count: number }[]> {
  if (!db) return [];
  const rows = await db
    .select({ province: leads.province, count: sql<number>`count(*)::int` })
    .from(leads)
    .where(sql`${leads.province} IS NOT NULL AND ${leads.province} != ''`)
    .groupBy(leads.province)
    .orderBy(desc(sql`count(*)`))
    .limit(5);
  return (rows as { province: string | null; count: number }[]).filter(r => r.province !== null) as { province: string; count: number }[];
}

export async function getProfileConversion(): Promise<{ profile: string; leads: number; conversions: number; rate: number }[]> {
  if (!db) return [];

  // Get all quiz submissions grouped by profile (dominant pillar)
  const submissions = await db
    .select({ profile: quizSubmissions.profile, phone: quizSubmissions.phone })
    .from(quizSubmissions);

  if (submissions.length === 0) return [];

  // Build a map of phone -> dominant pillar (first part of "clareza-acao" format)
  const phoneToProfile = new Map<string, string>();
  for (const s of submissions) {
    if (!phoneToProfile.has(s.phone)) {
      const dominant = s.profile.split("-")[0] ?? s.profile;
      phoneToProfile.set(s.phone, dominant);
    }
  }

  // Get leads that have converted (status = comprou or upsell)
  const convertedLeads = await db
    .select({ phone: leads.phone })
    .from(leads)
    .where(sql`${leads.status} IN ('comprou', 'upsell')`);

  const convertedPhones = new Set(convertedLeads.map(l => l.phone));

  // Aggregate by profile
  const profileMap = new Map<string, { leads: number; conversions: number }>();

  for (const [phone, profile] of phoneToProfile.entries()) {
    const existing = profileMap.get(profile) ?? { leads: 0, conversions: 0 };
    existing.leads += 1;
    if (convertedPhones.has(phone)) existing.conversions += 1;
    profileMap.set(profile, existing);
  }

  return Array.from(profileMap.entries())
    .map(([profile, data]) => ({
      profile,
      leads: data.leads,
      conversions: data.conversions,
      rate: data.leads > 0 ? Math.round((data.conversions / data.leads) * 100) : 0
    }))
    .sort((a, b) => b.leads - a.leads);
}

// ── Funnel content ────────────────────────────────────────────────────────────

export const DEFAULT_WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/EY84u93L1uy3CSOFF6mBl7";

export const FUNNEL_CONTENT_DEFAULTS: Record<string, Record<string, string>> = {
  landing: {
    badge_text: "⚡ 2.847 pessoas já descobriram",
    headline: "O dinheiro passa pelas tuas mãos mas nunca fica.",
    subtitle: "Não é falta de esforço. É o teu padrão mental financeiro a sabotar-te em silêncio. Em 3 minutos descobres exatamente o que te trava — e como inverter.",
    cta_text: "Descobrir o meu padrão agora →",
    trust_badge_1: "✓ Gratuito e Imediato",
    trust_badge_2: "✓ 2.847 análises feitas",
  },
  resultado: {
    explanation_text: "Trabalhaste, esforçaste-te, prometeste mudar. Mas existe um padrão invisível que repete o mesmo ciclo — e não é culpa tua. É neurológico. As tuas respostas revelam exatamente onde esse ciclo se quebra.",
    closing_text: "A maioria das pessoas vai fechar esta página e amanhã vai estar na mesma situação. Os que agem agora são os que mudam.",
    cta_text: "Quero a solução →",
  },
  payment: {
    support_label: "Precisas de ajuda para pagar? Tem alguma dúvida?",
    support_cta: "Falar com a equipa no WhatsApp",
    support_context: "Atendimento humano imediato",
    benefit_1: "Download imediato do Guia Definitivo",
    benefit_2: "Acesso ao Grupo VIP no WhatsApp",
    benefit_3: "Garantia de 7 dias sem risco",
    quick_reply_1: "É seguro pagar aqui?",
    quick_reply_2: "O que recebo exactamente?",
    quick_reply_3: "Como pago no ATM?",
    quick_reply_4: "4500 Kz é muito caro?",
    vip_cta: "Aceder ao Grupo VIP →",
    vip_context_payment: "Ainda estás a confirmar o pagamento. O grupo fica disponível após confirmação.",
    vip_context_confirmed: "Pagamento confirmado! Entra na comunidade 🎉",
    testimonial_1_name: "Maria Santos",
    testimonial_1_text: "Acesso imediato após o pagamento. Foi mesmo fácil e rápido.",
    testimonial_1_stars: "5",
    testimonial_2_name: "Carlos Mendes",
    testimonial_2_text: "Paguei pela referência no ATM e o acesso foi automático. Recomendo.",
    testimonial_2_stars: "5",
    testimonial_3_name: "João Ferreira",
    testimonial_3_text: "Processo simples e seguro. O guia chegou no momento a seguir ao pagamento.",
    testimonial_3_stars: "5",
  },
  oferta: {
    headline: "Riqueza Oculta: Guia Definitivo",
    subheading: "descobre os pilares estratégicos que separam quem gera resultados reais de quem apenas observa. Não é sobre sofrer mais, é sobre dominar o sistema.",
    cta_text: "DESBLOQUEAR AGORA",
    guarantee_text: "Se não ficares satisfeito, devolvemos 100% do valor. Sem perguntas.",
    scarcity_text: "Restam 14 vagas ao preço promocional",
    social_proof: "327+ pessoas já garantiram o seu acesso",
    bullet_1: "Os 5 Pilares da Riqueza Mental",
    bullet_2: "Como Reprogramar Crenças Limitantes",
    bullet_3: "Hábitos Estratégicos de Foco",
    bullet_4: "A Fórmula do Crescimento Financeiro",
    bullet_5: "Checklist de Hábitos Diários",
    bullet_6: "Garantia de 7 dias ou dinheiro de volta",
    testimonial_1_name: "Maria Santos",
    testimonial_1_text: "Fiz o simulador por curiosidade e fiquei chocada com o resultado. Em 3 semanas mudei 2 hábitos que estavam a sabotar as minhas finanças.",
    testimonial_1_stars: "5",
    testimonial_2_name: "Carlos Mendes",
    testimonial_2_text: "Sempre achei que o problema era o salário. O guia mostrou-me que o problema era a minha forma de pensar. Recomendo a toda a gente.",
    testimonial_2_stars: "5",
    testimonial_3_name: "João Ferreira",
    testimonial_3_text: "Comprei sem muita expectativa, mas o conteúdo é directo ao ponto. Sem teorias, só estratégias que funcionam mesmo.",
    testimonial_3_stars: "5",
    testimonial_4_name: "Ana Pereira",
    testimonial_4_text: "O perfil que recebi descreveu-me exactamente. Senti que foi feito para mim. Já indiquei a 4 amigas.",
    testimonial_4_stars: "5",
    testimonial_5_name: "José Nunes",
    testimonial_5_text: "Vale muito mais do que o preço. Tenho lido e relido o guia — cada vez encontro algo novo para aplicar.",
    testimonial_5_stars: "4",
    testimonial_6_name: "Etiene Kimbangu",
    testimonial_6_text: "Nunca pensei que um quiz pudesse revelar tanto sobre mim. Os exercícios práticos mudam mesmo a mentalidade.",
    testimonial_6_stars: "5",
  },
  simulador: {
    step_label: "Análise Gratuita • Resultado em 3 minutos",
    headline: "Para quem enviamos a tua análise?",
    subtitle: "Vamos personalizar o teu diagnóstico financeiro com base nas tuas respostas. O resultado chega direto ao teu WhatsApp.",
    cta_text: "Começar agora →",
    privacy_text: "🔒 Os teus dados são privados. Só usamos para enviar o teu resultado.",
  },
};

export async function getFunnelContentMap(pageType: string): Promise<Record<string, string>> {
  const defaults = FUNNEL_CONTENT_DEFAULTS[pageType] ?? {};
  if (!db) return defaults;
  const rows = await getFunnelContent(pageType);
  const dbMap: Record<string, string> = {};
  for (const row of rows) {
    if (row.content != null) dbMap[row.sectionKey] = row.content;
  }
  return { ...defaults, ...dbMap };
}

export async function seedDefaultFunnelContent(): Promise<void> {
  if (!db) return;
  for (const [pageType, fields] of Object.entries(FUNNEL_CONTENT_DEFAULTS)) {
    for (const [sectionKey, content] of Object.entries(fields)) {
      await db
        .insert(funnelContent)
        .values({ pageType, sectionKey, content, updatedAt: new Date() } as FunnelContentInsert)
        .onConflictDoNothing();
    }
  }
}

export async function getWhatsAppGroupLink(): Promise<string> {
  if (!db) return DEFAULT_WHATSAPP_GROUP_LINK;
  const rows = await db.select().from(settings).where(eq(settings.key, "whatsapp_group_link"));
  return rows[0]?.value ?? DEFAULT_WHATSAPP_GROUP_LINK;
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  if (!db) return;
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function getFunnelContent(pageType?: string): Promise<FunnelContentRecord[]> {
  if (!db) return [];
  const rows = pageType
    ? await db.select().from(funnelContent).where(eq(funnelContent.pageType, pageType))
    : await db.select().from(funnelContent);
  return rows.map(r => ({
    id: r.id,
    pageType: r.pageType,
    sectionKey: r.sectionKey,
    content: r.content,
    metadata: r.metadata,
    updatedAt: r.updatedAt.toISOString()
  }));
}

export async function upsertFunnelContent(pageType: string, sectionKey: string, content: string, metadata?: unknown) {
  if (!db) return;
  await db
    .insert(funnelContent)
    .values({ pageType, sectionKey, content, metadata, updatedAt: new Date() } as FunnelContentInsert)
    .onConflictDoUpdate({
      target: [funnelContent.pageType, funnelContent.sectionKey],
      set: { content, metadata, updatedAt: new Date() }
    });
}

// ── Member content ────────────────────────────────────────────────────────────

export async function getMemberContent(): Promise<MemberContentRecord[]> {
  if (!db) return [];
  const rows = await db
    .select()
    .from(memberContent)
    .orderBy(asc(memberContent.module), asc(memberContent.ordem));
  return rows.map(r => ({
    id: r.id,
    module: r.module,
    title: r.title,
    description: r.description,
    type: r.type,
    fileUrl: r.fileUrl,
    videoUrl: r.videoUrl,
    ordem: r.ordem,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString()
  }));
}

export async function insertMemberContent(payload: MemberContentInsert) {
  if (!db) return null;
  const rows = await db.insert(memberContent).values(payload).returning({ id: memberContent.id });
  return rows[0]?.id ?? null;
}

export async function updateMemberContent(id: number, patch: Partial<MemberContentInsert>) {
  if (!db) return;
  await db.update(memberContent).set(patch).where(eq(memberContent.id, id));
}

export async function deleteMemberContent(id: number) {
  if (!db) return;
  await db.delete(memberContent).where(eq(memberContent.id, id));
}

// ── Affiliates ─────────────────────────────────────────────────────────────────

export function generateAffiliateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ROA-";
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function rowToAffiliate(row: typeof affiliates.$inferSelect): AffiliateRecord {
  return {
    id: row.id,
    token: row.token,
    name: row.name,
    phone: row.phone,
    email: row.email,
    iban: row.iban,
    status: row.status as AffiliateStatus,
    commissionRate: row.commissionRate,
    totalClicks: row.totalClicks,
    totalSales: row.totalSales,
    totalEarnings: row.totalEarnings,
    currentBalance: row.currentBalance,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function insertAffiliate(payload: AffiliateInsert): Promise<AffiliateRecord | null> {
  if (!db) return null;
  const rows = await db.insert(affiliates).values(payload).returning();
  return rows[0] ? rowToAffiliate(rows[0]) : null;
}

export async function findAffiliateByToken(token: string): Promise<AffiliateRecord | null> {
  if (!db) return null;
  const rows = await db.select().from(affiliates).where(eq(affiliates.token, token)).limit(1);
  return rows[0] ? rowToAffiliate(rows[0]) : null;
}

export async function findAffiliateByPhone(phone: string): Promise<AffiliateRecord | null> {
  if (!db) return null;
  const rows = await db.select().from(affiliates).where(eq(affiliates.phone, phone)).limit(1);
  return rows[0] ? rowToAffiliate(rows[0]) : null;
}

export async function getAffiliates(page = 1, limit = 50): Promise<AffiliateRecord[]> {
  if (!db) return [];
  const offset = (page - 1) * limit;
  const rows = await db.select().from(affiliates).orderBy(desc(affiliates.createdAt)).limit(limit).offset(offset);
  return rows.map(rowToAffiliate);
}

export async function getPagedAffiliates(page = 1, limit = 20): Promise<PaginatedResult<AffiliateRecord>> {
  const offset = (page - 1) * limit;
  if (!db) {
    return { data: [], total: 0, page: 1, totalPages: 1 };
  }
  const [rows, [{ count }]] = await Promise.all([
    db.select().from(affiliates).orderBy(desc(affiliates.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(affiliates)
  ]);
  return {
    data: rows.map(rowToAffiliate),
    total: count,
    page,
    totalPages: Math.ceil(count / limit)
  };
}


export async function updateAffiliate(id: number, patch: Partial<AffiliateInsert>) {
  if (!db) return;
  await db.update(affiliates).set(patch).where(eq(affiliates.id, id));
}

export async function recordAffiliateClick(token: string) {
  if (!db) return;
  await db
    .update(affiliates)
    .set({ totalClicks: sql`${affiliates.totalClicks} + 1` })
    .where(eq(affiliates.token, token));
}

export async function recordAffiliateSale(checkoutReference: string) {
  if (!db) return;
  // Get checkout to find the affiliateToken
  const checkout = await findCheckout(checkoutReference);
  if (!checkout?.affiliateToken) return;

  const affiliate = await findAffiliateByToken(checkout.affiliateToken);
  if (!affiliate || affiliate.status !== "active") return;

  const commission = Math.floor(checkout.amount * affiliate.commissionRate / 100);
  await db
    .update(affiliates)
    .set({
      totalSales: sql`${affiliates.totalSales} + 1`,
      totalEarnings: sql`${affiliates.totalEarnings} + ${commission}`,
      currentBalance: sql`${affiliates.currentBalance} + ${commission}`,
    })
    .where(eq(affiliates.id, affiliate.id));
}

// ── Payout Requests ────────────────────────────────────────────────────────────

function rowToPayout(row: typeof payoutRequests.$inferSelect): PayoutRequestRecord {
  return {
    id: row.id,
    affiliateId: row.affiliateId,
    amount: row.amount,
    status: row.status as PayoutStatus,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function insertPayoutRequest(affiliateId: number, amount: number): Promise<PayoutRequestRecord | null> {
  if (!db) return null;
  const rows = await db.insert(payoutRequests).values({ affiliateId, amount } as PayoutRequestInsert).returning();
  return rows[0] ? rowToPayout(rows[0]) : null;
}

export async function getPayoutRequestsByAffiliate(affiliateId: number): Promise<PayoutRequestRecord[]> {
  if (!db) return [];
  const rows = await db.select().from(payoutRequests).where(eq(payoutRequests.affiliateId, affiliateId)).orderBy(desc(payoutRequests.createdAt));
  return rows.map(rowToPayout);
}

export async function getPayoutRequests(status?: PayoutStatus): Promise<PayoutRequestRecord[]> {
  if (!db) return [];
  const query = db.select().from(payoutRequests).orderBy(desc(payoutRequests.createdAt));
  if (status) {
    const rows = await db.select().from(payoutRequests).where(eq(payoutRequests.status, status)).orderBy(desc(payoutRequests.createdAt));
    return rows.map(rowToPayout);
  }
  const rows = await query;
  return rows.map(rowToPayout);
}

export async function updatePayoutRequest(id: number, status: PayoutStatus, notes?: string) {
  if (!db) return;
  await db.update(payoutRequests).set({ status, notes: notes ?? null, updatedAt: new Date() }).where(eq(payoutRequests.id, id));
}
