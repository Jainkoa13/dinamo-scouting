import { openDB, type IDBPDatabase } from "idb";

export interface LocalPlayer {
  id: number;
  teamId?: number | null;
  nombre: string;
  alias?: string | null;
  posicion: string;
  pierna: string;
  edad: number;
  ano?: number | null;
  altura?: number | null;
  peso?: number | null;
  velocidad: number;
  tecnica: number;
  fisico: number;
  actitud: number;
  reflejo?: number | null;
  pais?: string | null;
  observaciones?: string | null;
  foto?: string | null;
  fotoTarjeta?: string | null;
  createdAt: string;
}

export interface LocalTeam {
  id: number;
  nombre: string;
  createdAt: string;
}

let _db: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (!_db) {
    _db = await openDB("dinamo-scouting", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("players")) {
          const ps = db.createObjectStore("players", { keyPath: "id", autoIncrement: true });
          ps.createIndex("by-team", "teamId");
        }
        if (!db.objectStoreNames.contains("teams")) {
          db.createObjectStore("teams", { keyPath: "id", autoIncrement: true });
        }
      },
    });
  }
  return _db;
}

export async function getPlayers(): Promise<LocalPlayer[]> {
  const db = await getDb();
  return db.getAll("players");
}

export async function getPlayer(id: number): Promise<LocalPlayer | undefined> {
  const db = await getDb();
  return db.get("players", id);
}

export async function addPlayer(data: Omit<LocalPlayer, "id" | "createdAt">): Promise<LocalPlayer> {
  const db = await getDb();
  const record = { ...data, createdAt: new Date().toISOString() };
  const id = (await db.add("players", record as LocalPlayer)) as number;
  return { ...record, id };
}

export async function updatePlayer(id: number, data: Partial<Omit<LocalPlayer, "id" | "createdAt">>): Promise<LocalPlayer> {
  const db = await getDb();
  const existing = await db.get("players", id) as LocalPlayer;
  if (!existing) throw new Error("Jugador no encontrado");
  const updated: LocalPlayer = { ...existing, ...data };
  await db.put("players", updated);
  return updated;
}

export async function deletePlayer(id: number): Promise<void> {
  const db = await getDb();
  await db.delete("players", id);
}

export async function getTeams(): Promise<LocalTeam[]> {
  const db = await getDb();
  return db.getAll("teams");
}

export async function addTeam(nombre: string): Promise<LocalTeam> {
  const db = await getDb();
  const record = { nombre, createdAt: new Date().toISOString() };
  const id = (await db.add("teams", record as LocalTeam)) as number;
  return { ...record, id };
}

export async function updateTeam(id: number, nombre: string): Promise<LocalTeam> {
  const db = await getDb();
  const existing = await db.get("teams", id) as LocalTeam;
  if (!existing) throw new Error("Equipo no encontrado");
  const updated: LocalTeam = { ...existing, nombre };
  await db.put("teams", updated);
  return updated;
}

export async function deleteTeam(id: number): Promise<void> {
  const db = await getDb();
  await db.delete("teams", id);
  const players: LocalPlayer[] = await db.getAll("players");
  for (const p of players) {
    if (p.teamId === id) await db.put("players", { ...p, teamId: null });
  }
}
