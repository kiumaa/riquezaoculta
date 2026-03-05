import { integer, jsonb, pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const checkoutStatusEnum = pgEnum("checkout_status", ["pending", "paid", "failed"]);

export const leads = pgTable("leads", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  source: varchar("source", { length: 50 }).notNull(),
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

export type LeadInsert = typeof leads.$inferInsert;
export type CheckoutInsert = typeof checkouts.$inferInsert;
