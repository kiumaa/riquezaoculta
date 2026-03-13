import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: varchar("value", { length: 255 }).notNull()
});

export const checkoutStatusEnum = pgEnum("checkout_status", ["pending", "paid", "failed"]);
export const leadStatusEnum = pgEnum("lead_status", ["novo", "contactado", "comprou", "abandonou", "upsell"]);

export const leads = pgTable("leads", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  province: varchar("province", { length: 100 }),
  source: varchar("source", { length: 50 }).notNull(),
  quizProfile: varchar("quiz_profile", { length: 50 }),
  status: leadStatusEnum("status").default("novo").notNull(),
  notes: varchar("notes", { length: 500 }),
  journey: jsonb("journey"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const checkouts = pgTable("checkouts", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  reference: varchar("reference", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  entity: varchar("entity", { length: 32 }).notNull(),
  paymentReference: varchar("payment_reference", { length: 64 }).notNull(),
  amount: integer("amount").notNull(),
  status: checkoutStatusEnum("status").default("pending").notNull(),
  providerPayload: jsonb("provider_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const quizSubmissions = pgTable("quiz_submissions", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  leadId: integer("lead_id"),
  phone: varchar("phone", { length: 20 }).notNull(),
  answers: jsonb("answers").notNull(),
  scores: jsonb("scores").notNull(),
  profile: varchar("profile", { length: 50 }).notNull(),
  profileTitle: varchar("profile_title", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const funnelContent = pgTable("funnel_content", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  pageType: varchar("page_type", { length: 50 }).notNull(),
  sectionKey: varchar("section_key", { length: 100 }).notNull(),
  content: text("content"),
  metadata: jsonb("metadata"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => [unique().on(t.pageType, t.sectionKey)]);

export const memberContent = pgTable("member_content", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  module: varchar("module", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  type: varchar("type", { length: 20 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }),
  videoUrl: varchar("video_url", { length: 500 }),
  ordem: integer("ordem").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export type LeadInsert = typeof leads.$inferInsert;
export type CheckoutInsert = typeof checkouts.$inferInsert;
export type QuizSubmissionInsert = typeof quizSubmissions.$inferInsert;
export type FunnelContentInsert = typeof funnelContent.$inferInsert;
export type MemberContentInsert = typeof memberContent.$inferInsert;
