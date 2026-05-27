import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Usuario y contraseña requeridos" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

  if (!user || !user.active) {
    res.status(401).json({ error: "Credenciales incorrectas o usuario inactivo" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Credenciales incorrectas o usuario inactivo" });
    return;
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.role = user.role;

  res.json({ id: user.id, username: user.username, role: user.role });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res): void => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  res.json({ id: req.session.userId, username: req.session.username, role: req.session.role });
});

router.get("/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db
    .select({ id: usersTable.id, username: usersTable.username, role: usersTable.role, active: usersTable.active, createdAt: usersTable.createdAt })
    .from(usersTable)
    .orderBy(usersTable.createdAt);
  res.json(users);
});

router.post("/users", requireAdmin, async (req, res): Promise<void> => {
  const { username, password, role } = req.body as { username?: string; password?: string; role?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Usuario y contraseña requeridos" });
    return;
  }

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    res.status(409).json({ error: `El usuario "${username}" ya existe` });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ username, password: hashed, role: role === "admin" ? "admin" : "user" })
    .returning({ id: usersTable.id, username: usersTable.username, role: usersTable.role, active: usersTable.active });

  res.status(201).json(user);
});

router.patch("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { active, password, role } = req.body as { active?: boolean; password?: string; role?: string };

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (active !== undefined) updates.active = active;
  if (password) updates.password = await bcrypt.hash(password, 12);
  if (role === "admin" || role === "user") updates.role = role;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nada que actualizar" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, username: usersTable.username, role: usersTable.role, active: usersTable.active });

  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  res.json(user);
});

router.delete("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);

  const [target] = await db.select({ id: usersTable.id, username: usersTable.username })
    .from(usersTable).where(eq(usersTable.id, id));

  if (!target) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  if (target.username === "admin") {
    res.status(403).json({ error: "No se puede eliminar el usuario administrador principal" });
    return;
  }

  if (target.id === req.session.userId) {
    res.status(403).json({ error: "No puedes eliminarte a ti mismo" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

export default router;
