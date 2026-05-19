import { Router, type IRouter } from "express";
import {
  db,
  tabsTable,
  historyTable,
  type TabItem,
  type TabRow,
} from "@workspace/db";
import {
  CreateTabBody,
  GetTabParams,
  DeleteTabParams,
  AddTabItemParams,
  AddTabItemBody,
  RemoveTabItemParams,
  PayTabParams,
  PayTabBody,
  CloseTabParams,
  CloseTabBody,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function totalOf(items: TabItem[]): number {
  return items.reduce((s, i) => s + i.price * i.qty, 0);
}

function serialize(t: TabRow) {
  return {
    id: t.id,
    customer: t.customer,
    openedBy: t.openedBy,
    status: t.status as "open" | "paid",
    items: t.items,
    total: totalOf(t.items),
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/tabs", async (_req, res) => {
  const rows = await db.select().from(tabsTable);
  res.json(rows.map(serialize));
});

router.post("/tabs", async (req, res) => {
  const body = CreateTabBody.parse(req.body);

  const [row] = await db
    .insert(tabsTable)
    .values({
      customer: body.customer,
      openedBy: body.openedBy ?? null,
      items: [],
      status: "open",
    })
    .returning();

  res.status(201).json(serialize(row));
});

router.get("/tabs/:id", async (req, res) => {
  const { id } = GetTabParams.parse(req.params);
  const [row] = await db.select().from(tabsTable).where(eq(tabsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(serialize(row));
});

router.delete("/tabs/:id", async (req, res) => {
  const { id } = DeleteTabParams.parse(req.params);
  await db.delete(tabsTable).where(eq(tabsTable.id, id));
  res.status(204).send();
});

router.post("/tabs/:id/items", async (req, res) => {
  const { id } = AddTabItemParams.parse(req.params);
  const body = AddTabItemBody.parse(req.body);

  const [row] = await db.select().from(tabsTable).where(eq(tabsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const items = [...row.items];
  const existing = items.find((i) => i.name === body.name);

  if (existing) {
    existing.qty += 1;
    if (!existing.addedBy && body.addedBy) {
      existing.addedBy = body.addedBy;
    }
  } else {
    items.push({
      name: body.name,
      price: body.price,
      qty: 1,
      addedBy: body.addedBy ?? undefined,
    });
  }

  const [updated] = await db
    .update(tabsTable)
    .set({ items })
    .where(eq(tabsTable.id, id))
    .returning();

  res.json(serialize(updated));
});

router.delete("/tabs/:id/items/:itemName", async (req, res) => {
  const { id, itemName } = RemoveTabItemParams.parse(req.params);

  const [row] = await db.select().from(tabsTable).where(eq(tabsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  let items = [...row.items];
  const existing = items.find((i) => i.name === itemName);

  if (existing) {
    existing.qty -= 1;
    if (existing.qty <= 0) items = items.filter((i) => i.name !== itemName);
  }

  const [updated] = await db
    .update(tabsTable)
    .set({ items })
    .where(eq(tabsTable.id, id))
    .returning();

  res.json(serialize(updated));
});

router.post("/tabs/:id/pay", async (req, res) => {
  const { id } = PayTabParams.parse(req.params);
  const { paymentMethod, closedBy } = PayTabBody.parse(req.body);

  const [row] = await db.select().from(tabsTable).where(eq(tabsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const total = totalOf(row.items);

  await db.insert(historyTable).values({
    customer: row.customer,
    items: row.items,
    total,
    paymentMethod,
    closedBy: closedBy ?? null,
  });

  await db.delete(tabsTable).where(eq(tabsTable.id, id));

  res.json(serialize({ ...row, status: "paid" }));
});

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  credito: "Crédito",
  debito: "Débito",
  pix: "Pix",
};

router.post("/tabs/:id/close", async (req, res) => {
  const { id } = CloseTabParams.parse(req.params);
  const { paymentMethod, closedBy } = CloseTabBody.parse(req.body);

  const [row] = await db.select().from(tabsTable).where(eq(tabsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const total = totalOf(row.items);

  let msg = `*FM BAR*\n\nCliente: ${row.customer}\n\n`;

  for (const i of row.items) {
    msg += `${i.name} x${i.qty} = R$ ${(i.price * i.qty).toFixed(2)}\n`;
  }

  msg += `\n*Total: R$ ${total.toFixed(2)}*\nPagamento: ${
    PAYMENT_LABELS[paymentMethod] ?? paymentMethod
  }`;

  if (closedBy) {
    msg += `\nFechado por: ${closedBy}`;
  }

  msg += `\nObrigado!`;

  await db.insert(historyTable).values({
    customer: row.customer,
    items: row.items,
    total,
    paymentMethod,
    closedBy: closedBy ?? null,
  });

  await db.delete(tabsTable).where(eq(tabsTable.id, id));

  res.json({
    tab: serialize(row),
    whatsappMessage: msg,
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(msg)}`,
  });
});

export default router;