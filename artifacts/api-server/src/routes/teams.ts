import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, teamsTable } from "@workspace/db";

const router: IRouter = Router();

function isAdmin(req: Parameters<Parameters<IRouter["get"]>[1]>[0]): boolean {
  return req.session?.role === "admin";
}

router.get("/teams", async (req, res): Promise<void> => {
  const uid = req.session.userId!;
  const teams = isAdmin(req)
    ? await db.select().from(teamsTable).orderBy(teamsTable.nombre)
    : await db.select().from(teamsTable).where(eq(teamsTable.userId, uid)).orderBy(teamsTable.nombre);
  res.json(teams.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })));
});

router.post("/teams", async (req, res): Promise<void> => {
  const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
  if (!nombre) {
    res.status(400).json({ error: "El nombre del equipo es requerido" });
    return;
  }
  const [team] = await db
    .insert(teamsTable)
    .values({ nombre, userId: req.session.userId! })
    .returning();
  res.status(201).json({ ...team, createdAt: team.createdAt.toISOString() });
});

router.patch("/teams/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
  if (!nombre) {
    res.status(400).json({ error: "El nombre del equipo es requerido" });
    return;
  }

  const filter = isAdmin(req)
    ? eq(teamsTable.id, id)
    : and(eq(teamsTable.id, id), eq(teamsTable.userId, req.session.userId!));

  const [team] = await db.update(teamsTable).set({ nombre }).where(filter).returning();
  if (!team) {
    res.status(404).json({ error: "Equipo no encontrado" });
    return;
  }
  res.json({ ...team, createdAt: team.createdAt.toISOString() });
});

router.delete("/teams/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const filter = isAdmin(req)
    ? eq(teamsTable.id, id)
    : and(eq(teamsTable.id, id), eq(teamsTable.userId, req.session.userId!));

  const [team] = await db.delete(teamsTable).where(filter).returning();
  if (!team) {
    res.status(404).json({ error: "Equipo no encontrado" });
    return;
  }
  res.sendStatus(204);
});

export default router;
