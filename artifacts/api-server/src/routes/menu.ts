import { Router, type IRouter } from "express";
import { db, menuItemsTable, MENU_SEED } from "@workspace/db";
import { CreateMenuItemBody, DeleteMenuItemParams } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/menu", async (_req, res) => {
  const rows = await db.select().from(menuItemsTable);

  const byCat = new Map<
    string,
    { category: string; items: typeof rows }
  >();

  for (const r of rows) {
    if (!byCat.has(r.category)) {
      byCat.set(r.category, { category: r.category, items: [] });
    }

    byCat.get(r.category)!.items.push(r);
  }

  res.json(Array.from(byCat.values()));
});

router.post("/menu", async (req, res) => {
  const body = CreateMenuItemBody.parse(req.body);

  const [row] = await db
    .insert(menuItemsTable)
    .values({
      name: body.name,
      price: body.price,
      category: body.category,
    })
    .returning();

  res.status(201).json(row);
});

router.post("/menu/import-fm", async (_req, res) => {
  await db.delete(menuItemsTable);

  const inserted = await db
    .insert(menuItemsTable)
    .values(MENU_SEED)
    .returning();

  res.json({
    success: true,
    total: inserted.length,
  });
});

router.delete("/menu/:id", async (req, res) => {
  const { id } = DeleteMenuItemParams.parse(req.params);

  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id));

  res.status(204).send();
});

export default router;