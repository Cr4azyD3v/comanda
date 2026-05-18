import {
  pgTable,
  text,
  uuid,
  jsonb,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";

export type TabItem = { name: string; price: number; qty: number };

export const tabsTable = pgTable("tabs", {
  id: uuid("id").primaryKey().defaultRandom(),
  customer: text("customer").notNull(),
  status: text("status").notNull().default("open"),
  items: jsonb("items").$type<TabItem[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TabRow = typeof tabsTable.$inferSelect;

export const historyTable = pgTable("history", {
  id: uuid("id").primaryKey().defaultRandom(),
  customer: text("customer").notNull(),
  items: jsonb("items").$type<TabItem[]>().notNull().default([]),
  total: doublePrecision("total").notNull(),
  paymentMethod: text("payment_method").notNull().default("dinheiro"),
  closedAt: timestamp("closed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type HistoryRow = typeof historyTable.$inferSelect;
