import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedAdmin() {
  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, "admin"));
  if (!existing) {
    const hashed = await bcrypt.hash("Dinamo2024!", 12);
    await db.insert(usersTable).values({ username: "admin", password: hashed, role: "admin", active: true });
    logger.info("Admin user created (username: admin, password: Dinamo2024!)");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  try {
    await seedAdmin();
  } catch (e) {
    logger.error({ err: e }, "Error seeding admin user");
  }
});
