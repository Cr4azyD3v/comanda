import { pgTable, text, uuid, doublePrecision } from "drizzle-orm/pg-core";

export const menuItemsTable = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(),
});

export type MenuItemRow = typeof menuItemsTable.$inferSelect;
