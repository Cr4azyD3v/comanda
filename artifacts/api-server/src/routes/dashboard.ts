import { Router, type IRouter } from "express";
import { db, tabsTable, historyTable, type TabItem } from "@workspace/db";
import { gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res) => {
  const tabs = await db.select().from(tabsTable);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayHistory = await db
    .select()
    .from(historyTable)
    .where(gte(historyTable.closedAt, startOfDay));

  const openTabs = tabs.filter((t) => t.status === "open").length;
  const openValue = tabs.reduce(
    (s, t) =>
      s + t.items.reduce((ss, i) => ss + i.price * i.qty, 0),
    0,
  );
  const revenueToday = todayHistory.reduce((s, h) => s + h.total, 0);
  const ordersToday = todayHistory.length;

  const counts = new Map<string, { name: string; qty: number; revenue: number }>();
  const accumulate = (items: TabItem[]) => {
    for (const i of items) {
      const cur = counts.get(i.name) ?? { name: i.name, qty: 0, revenue: 0 };
      cur.qty += i.qty;
      cur.revenue += i.price * i.qty;
      counts.set(i.name, cur);
    }
  };
  for (const h of todayHistory) accumulate(h.items);
  for (const t of tabs) accumulate(t.items);

  const topItems = Array.from(counts.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  res.json({ openTabs, openValue, revenueToday, ordersToday, topItems });
});

export default router;
