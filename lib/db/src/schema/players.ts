import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  teamId: integer("team_id"),
  nombre: text("nombre").notNull(),
  alias: text("alias"),
  posicion: text("posicion").notNull(),
  pierna: text("pierna").notNull(),
  edad: integer("edad").notNull(),
  ano: integer("ano"),
  altura: real("altura"),
  peso: real("peso"),
  velocidad: integer("velocidad").notNull().default(5),
  tecnica: integer("tecnica").notNull().default(5),
  fisico: integer("fisico").notNull().default(5),
  actitud: integer("actitud").notNull().default(5),
  reflejo: integer("reflejo"),
  pais: text("pais"),
  observaciones: text("observaciones"),
  foto: text("foto"),
  fotoTarjeta: text("foto_tarjeta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true, createdAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;
