import { Router, type IRouter } from "express";
import { db, historyTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.delete("/history", async (_req, res) => {
  await db.delete(historyTable);
  res.status(204).send();
});

router.get("/history", async (_req, res) => {
  const rows = await db
    .select()
    .from(historyTable)
    .orderBy(desc(historyTable.closedAt));
  res.json(
    rows.map((r) => ({
      id: r.id,
      customer: r.customer,
      items: r.items,
      total: r.total,
      paymentMethod: (r.paymentMethod ?? "dinheiro") as "dinheiro" | "credito" | "debito" | "pix",
      closedAt: r.closedAt.toISOString(),
    })),
  );
});

export default router;
