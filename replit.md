# Dinamo Ibaiondo Scouting

Sistema de scouting de fútbol sala para el Dinamo Ibaiondo, con fichas de jugadores al estilo FIFA.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (`artifacts/futbol-scout`)
- API: Express 5 (`artifacts/api-server`)
- DB: PostgreSQL + Drizzle ORM
- Auth: express-session + bcryptjs + connect-pg-simple
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/players.ts` — players table schema
- `lib/db/src/schema/users.ts` — users table schema (auth)
- `artifacts/api-server/src/app.ts` — Express app + session middleware
- `artifacts/api-server/src/routes/auth.ts` — login/logout/me + user management routes
- `artifacts/api-server/src/lib/auth.ts` — requireAuth / requireAdmin middleware
- `artifacts/futbol-scout/src/contexts/auth-context.tsx` — React auth context
- `artifacts/futbol-scout/src/lib/auth-api.ts` — frontend auth API calls
- `artifacts/futbol-scout/src/pages/login.tsx` — login page
- `artifacts/futbol-scout/src/pages/admin.tsx` — user management panel (admin only)

## Architecture decisions

- Session-based auth (cookie): same domain for frontend and API through the Replit proxy, so cookies are sent automatically without `credentials: include`.
- Sessions stored in PostgreSQL via `connect-pg-simple` (`session` table, auto-created).
- Admin user seeded automatically on server start if it doesn't exist yet.
- All `/api/players` and `/api/remove-bg` routes are protected by `requireAuth`. Only `/api/auth/*` and `/api/healthz` are public.
- User management (create, activate/deactivate, change password) is restricted to `role: "admin"`.

## Product

- Fichas de jugadores de fútbol sala con valoraciones (velocidad, técnica, físico, actitud)
- Vista de carta estilo FIFA con foto y estadísticas
- Exportación a Excel e imagen PNG de la ficha
- Comparación de jugadores
- PWA instalable en Android/iOS
- Control de acceso con login — solo usuarios validados por el administrador pueden entrar
- Gestión de equipos: cada usuario puede crear equipos propios (Cadete A, Juvenil, etc.) y asignar jugadores
- Filtro por equipo en la lista de jugadores
- Columna "Equipo" incluida en el Excel exportado

## User preferences

- Language: Spanish (toda la UI en español)
- Edad shown as "X/X+1" format (e.g. "15/16") computed from birth year

## Gotchas

- After DB schema changes, always run `pnpm --filter @workspace/db run push` before restarting the API server.
- **NEVER use `push-force`** — it drops unrecognized tables including `session`. Use interactive `push` and decline any table drops.
- The admin user (username: `admin`) is created automatically with password `Dinamo2024!` on first run. Change it from the admin panel.
- `connect-pg-simple` uses `createTableIfMissing: false`. The `session` table is defined in `lib/db/src/schema/session.ts` and must exist in the DB.
- If the `session` table is missing, recreate it: `CREATE TABLE "session" ("sid" varchar NOT NULL, "sess" json NOT NULL, "expire" timestamp(6) NOT NULL, PRIMARY KEY ("sid")); CREATE INDEX "IDX_session_expire" ON "session" ("expire");`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
