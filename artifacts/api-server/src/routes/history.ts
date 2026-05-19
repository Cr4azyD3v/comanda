import { Router, type IRouter } from "express";
import { db, historyTable, tabsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

router.delete("/history", async (_req, res) => {
  await db.delete(historyTable);
  res.status(204).send();
});

router.get("/history", async (_req, res) => {
  const rows = await db.select().from(historyTable).orderBy(desc(historyTable.closedAt));

  res.json(
    rows.map((r) => ({
      id: r.id,
      customer: r.customer,
      items: r.items,
      total: r.total,
      paymentMethod: r.paymentMethod ?? "dinheiro",
      closedBy: r.closedBy,
      closedAt: r.closedAt.toISOString(),
    })),
  );
});

router.post("/history/:id/reopen", async (req, res) => {
  const { id } = req.params;

  const [entry] = await db.select().from(historyTable).where(eq(historyTable.id, id));

  if (!entry) {
    res.status(404).json({ error: "Histórico não encontrado" });
    return;
  }

  const [newTab] = await db.insert(tabsTable).values({
    customer: entry.customer,
    openedBy: `Reaberto por ${req.body?.reopenedBy ?? "Sistema"}`,
    items: entry.items,
    status: "open",
  }).returning();

  await db.delete(historyTable).where(eq(historyTable.id, id));

  res.json({
    success: true,
    reopenedTab: newTab,
  });
});

export default router;