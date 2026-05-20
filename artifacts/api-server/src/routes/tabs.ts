import { Router, type IRouter } from "express";
import { db, tabsTable, historyTable, type TabItem, type TabRow } from "@workspace/db";
import {
  GetTabParams,
  DeleteTabParams,
  AddTabItemParams,
  RemoveTabItemParams,
  PayTabParams,
  CloseTabParams,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function totalOf(items: TabItem[]): number {
  return items.reduce((total, item) => total + item.price * item.qty, 0);
}

function serialize(tab: TabRow) {
  return {
    id: tab.id,
    customer: tab.customer,
    openedBy: tab.openedBy,
    status: tab.status as "open" | "paid",
    items: tab.items,
    total: totalOf(tab.items),
    createdAt: tab.createdAt.toISOString(),
  };
}

async function getTabById(id: string) {
  const [tab] = await db.select().from(tabsTable).where(eq(tabsTable.id, id));
  return tab;
}

router.get("/tabs", async (_req, res) => {
  try {
    const rows = await db.select().from(tabsTable);
    res.json(rows.map(serialize));
  } catch (error) {
    console.error("Erro ao listar comandas:", error);
    res.status(500).json({ error: "Erro ao listar comandas" });
  }
});

router.post("/tabs", async (req, res) => {
  try {
    const body = req.body as { customer?: string; openedBy?: string };
    const customer = body.customer?.trim();

    if (!customer) {
      res.status(400).json({ error: "Nome do cliente é obrigatório" });
      return;
    }

    const [row] = await db
      .insert(tabsTable)
      .values({
        customer,
        openedBy: body.openedBy || "Desconhecido",
        items: [],
        status: "open",
      })
      .returning();

    res.status(201).json(serialize(row));
  } catch (error) {
    console.error("Erro ao criar comanda:", error);
    res.status(500).json({ error: "Erro ao criar comanda" });
  }
});

router.get("/tabs/:id", async (req, res) => {
  try {
    const { id } = GetTabParams.parse(req.params);
    const tab = await getTabById(id);

    if (!tab) {
      res.status(404).json({ error: "Comanda não encontrada" });
      return;
    }

    res.json(serialize(tab));
  } catch (error) {
    console.error("Erro ao buscar comanda:", error);
    res.status(500).json({ error: "Erro ao buscar comanda" });
  }
});

router.delete("/tabs/:id", async (req, res) => {
  try {
    const { id } = DeleteTabParams.parse(req.params);
    await db.delete(tabsTable).where(eq(tabsTable.id, id));
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir comanda:", error);
    res.status(500).json({ error: "Erro ao excluir comanda" });
  }
});

router.post("/tabs/:id/items", async (req, res) => {
  try {
    const { id } = AddTabItemParams.parse(req.params);
    const body = req.body as { name?: string; price?: number; addedBy?: string };

    const name = body.name?.trim();
    const price = Number(body.price);
    const addedBy = body.addedBy || "Desconhecido";

    if (!name || !Number.isFinite(price)) {
      res.status(400).json({ error: "Item inválido" });
      return;
    }

    const tab = await getTabById(id);

    if (!tab) {
      res.status(404).json({ error: "Comanda não encontrada" });
      return;
    }

    const items = Array.isArray(tab.items) ? [...tab.items] : [];

    const existing = items.find(
      (item) => item.name === name && item.price === price && item.addedBy === addedBy,
    );

    if (existing) {
      existing.qty += 1;
    } else {
      items.push({
        name,
        price,
        qty: 1,
        addedBy,
      });
    }

    const [updated] = await db
      .update(tabsTable)
      .set({ items })
      .where(eq(tabsTable.id, id))
      .returning();

    res.json(serialize(updated));
  } catch (error) {
    console.error("Erro ao adicionar item:", error);
    res.status(500).json({ error: "Erro ao adicionar item" });
  }
});

router.delete("/tabs/:id/items/:itemName", async (req, res) => {
  try {
    const { id, itemName } = RemoveTabItemParams.parse(req.params);
    const decodedItemName = decodeURIComponent(itemName);

    const tab = await getTabById(id);

    if (!tab) {
      res.status(404).json({ error: "Comanda não encontrada" });
      return;
    }

    const items = Array.isArray(tab.items) ? [...tab.items] : [];

    const itemIndex = items.findIndex((item) => item.name === decodedItemName);

    if (itemIndex === -1) {
      res.json(serialize(tab));
      return;
    }

    const item = items[itemIndex];

    if (item.qty > 1) {
      items[itemIndex] = {
        ...item,
        qty: item.qty - 1,
      };
    } else {
      items.splice(itemIndex, 1);
    }

    const [updated] = await db
      .update(tabsTable)
      .set({ items })
      .where(eq(tabsTable.id, id))
      .returning();

    res.json(serialize(updated));
  } catch (error) {
    console.error("Erro ao remover item:", error);
    res.status(500).json({ error: "Erro ao remover item" });
  }
});

router.post("/tabs/:id/pay", async (req, res) => {
  try {
    const { id } = PayTabParams.parse(req.params);
    const body = req.body as { paymentMethod?: string; closedBy?: string };

    const tab = await getTabById(id);

    if (!tab) {
      res.status(404).json({ error: "Comanda não encontrada" });
      return;
    }

    const total = totalOf(tab.items);
    const paymentMethod = body.paymentMethod || "dinheiro";
    const closedBy = body.closedBy || "Desconhecido";

    await db.insert(historyTable).values({
      customer: tab.customer,
      items: tab.items,
      total,
      paymentMethod,
      closedBy,
    });

    await db.delete(tabsTable).where(eq(tabsTable.id, id));

    res.json(serialize({ ...tab, status: "paid" }));
  } catch (error) {
    console.error("Erro ao pagar comanda:", error);
    res.status(500).json({ error: "Erro ao pagar comanda" });
  }
});

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  credito: "Crédito",
  debito: "Débito",
  pix: "Pix",
};

router.post("/tabs/:id/close", async (req, res) => {
  try {
    const { id } = CloseTabParams.parse(req.params);
    const body = req.body as { paymentMethod?: string; closedBy?: string };

    const tab = await getTabById(id);

    if (!tab) {
      res.status(404).json({ error: "Comanda não encontrada" });
      return;
    }

    const total = totalOf(tab.items);
    const paymentMethod = body.paymentMethod || "dinheiro";
    const closedBy = body.closedBy || "Desconhecido";

    let msg = `*FM BAR*\n\nCliente: ${tab.customer}\n\n`;

    for (const item of tab.items) {
      msg += `${item.name} x${item.qty} = R$ ${(item.price * item.qty).toFixed(2)}`;

      if (item.addedBy) {
        msg += ` (${item.addedBy})`;
      }

      msg += "\n";
    }

    msg += `\n*Total: R$ ${total.toFixed(2)}*`;
    msg += `\nPagamento: ${PAYMENT_LABELS[paymentMethod] ?? paymentMethod}`;
    msg += `\nFechado por: ${closedBy}`;
    msg += `\nObrigado!`;

    await db.insert(historyTable).values({
      customer: tab.customer,
      items: tab.items,
      total,
      paymentMethod,
      closedBy,
    });

    await db.delete(tabsTable).where(eq(tabsTable.id, id));

    res.json({
      tab: serialize(tab),
      whatsappMessage: msg,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(msg)}`,
    });
  } catch (error) {
    console.error("Erro ao fechar comanda:", error);
    res.status(500).json({ error: "Erro ao fechar comanda" });
  }
});

export default router;