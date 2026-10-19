import path from "node:path";
import { count } from "drizzle-orm";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import * as schema from "./schema";

export type DB = PostgresJsDatabase<typeof schema>;

const isPostgres = () => !!process.env.DATABASE_URL?.startsWith("postgres");

async function connect(): Promise<DB> {
  if (isPostgres()) {
    const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 5 });
    return drizzlePostgres(client, { schema });
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DIR || path.join(process.cwd(), ".data", "pglite");
  const { mkdirSync } = await import("fs");
  mkdirSync(path.dirname(dir), { recursive: true });
  const client = new PGlite(dir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db as unknown as DB;
}

async function seedAdmin(db: DB) {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const [{ value }] = await db.select({ value: count() }).from(schema.users);
  if (value > 0) return;
  await db.insert(schema.users).values({
    id: nanoid(),
    name: process.env.ADMIN_NAME || "Admin",
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "admin",
  });
}

const globalForDb = globalThis as unknown as { __dbPromise?: Promise<DB> };

export function getDb(): Promise<DB> {
  if (!globalForDb.__dbPromise) {
    globalForDb.__dbPromise = connect().then(async (db) => {
      await seedAdmin(db);
      return db;
    });
    globalForDb.__dbPromise.catch(() => (globalForDb.__dbPromise = undefined));
  }
  return globalForDb.__dbPromise;
}

export { schema };
