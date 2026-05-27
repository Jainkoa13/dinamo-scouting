import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, playersTable, usersTable } from "@workspace/db";
import {
  CreatePlayerBody,
  UpdatePlayerBody,
  GetPlayerParams,
  UpdatePlayerParams,
  DeletePlayerParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function isAdmin(req: Parameters<Parameters<IRouter["get"]>[1]>[0]): boolean {
  return req.session?.role === "admin";
}

function uid(req: Parameters<Parameters<IRouter["get"]>[1]>[0]): number {
  return req.session.userId as number;
}

function playerOwnerFilter(req: Parameters<Parameters<IRouter["get"]>[1]>[0]) {
  if (isAdmin(req)) return undefined;
  return eq(playersTable.userId, uid(req));
}

router.get("/players/stats", async (req, res): Promise<void> => {
  const filter = playerOwnerFilter(req);
  const players = filter
    ? await db.select().from(playersTable).where(filter)
    : await db.select().from(playersTable);

  const total = players.length;
  const avgVelocidad = total > 0 ? players.reduce((s, p) => s + p.velocidad, 0) / total : 0;
  const avgTecnica = total > 0 ? players.reduce((s, p) => s + p.tecnica, 0) / total : 0;
  const avgFisico = total > 0 ? players.reduce((s, p) => s + p.fisico, 0) / total : 0;
  const avgActitud = total > 0 ? players.reduce((s, p) => s + p.actitud, 0) / total : 0;

  const posicionMap = new Map<string, number>();
  const piernaMap = new Map<string, number>();

  for (const p of players) {
    posicionMap.set(p.posicion, (posicionMap.get(p.posicion) ?? 0) + 1);
    piernaMap.set(p.pierna, (piernaMap.get(p.pierna) ?? 0) + 1);
  }

  const byPosicion = Array.from(posicionMap.entries()).map(([posicion, count]) => ({ posicion, count }));
  const byPierna = Array.from(piernaMap.entries()).map(([pierna, count]) => ({ pierna, count }));

  res.json({ total, avgVelocidad, avgTecnica, avgFisico, avgActitud, byPosicion, byPierna });
});

router.get("/players", async (req, res): Promise<void> => {
  const filter = playerOwnerFilter(req);
  const players = filter
    ? await db.select().from(playersTable).where(filter).orderBy(sql`${playersTable.createdAt} desc`)
    : await db.select().from(playersTable).orderBy(sql`${playersTable.createdAt} desc`);
  res.json(players.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
});

router.post("/players", async (req, res): Promise<void> => {
  const parsed = CreatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db
    .insert(playersTable)
    .values({ ...parsed.data, userId: uid(req) })
    .returning();
  res.status(201).json({ ...player, createdAt: player.createdAt.toISOString() });
});

router.get("/players/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPlayerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const filter = isAdmin(req)
    ? eq(playersTable.id, params.data.id)
    : and(eq(playersTable.id, params.data.id), eq(playersTable.userId, uid(req)));

  const [player] = await db.select().from(playersTable).where(filter);
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  res.json({ ...player, createdAt: player.createdAt.toISOString() });
});

router.patch("/players/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePlayerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filter = isAdmin(req)
    ? eq(playersTable.id, params.data.id)
    : and(eq(playersTable.id, params.data.id), eq(playersTable.userId, uid(req)));

  const [player] = await db
    .update(playersTable)
    .set(parsed.data)
    .where(filter)
    .returning();

  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  res.json({ ...player, createdAt: player.createdAt.toISOString() });
});

router.delete("/players/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePlayerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const filter = isAdmin(req)
    ? eq(playersTable.id, params.data.id)
    : and(eq(playersTable.id, params.data.id), eq(playersTable.userId, uid(req)));

  const [player] = await db
    .delete(playersTable)
    .where(filter)
    .returning();

  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/players/:id/transfer", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { userId } = req.body as { userId?: unknown };

  if (!userId || typeof userId !== "number") {
    res.status(400).json({ error: "userId del destinatario requerido" });
    return;
  }

  const [targetUser] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId));
  if (!targetUser) {
    res.status(404).json({ error: "Usuario destinatario no encontrado" });
    return;
  }

  const [player] = await db
    .update(playersTable)
    .set({ userId, teamId: null })
    .where(eq(playersTable.id, id))
    .returning();

  if (!player) {
    res.status(404).json({ error: "Jugador no encontrado" });
    return;
  }

  res.json({ ...player, createdAt: player.createdAt.toISOString() });
});

export default router;
