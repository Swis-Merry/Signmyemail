import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "@/lib/db";

export const MAX_ASSET_BYTES = 4 * 1024 * 1024;
const ASSET_PREFIX = "/api/assets/";

export async function saveAsset(bytes: Buffer, contentType: string, sourceUrl?: string) {
  const db = await getDb();
  const id = nanoid(16);
  await db.insert(schema.assets).values({ id, contentType, bytes, sourceUrl });
  return { id, url: `${ASSET_PREFIX}${id}` };
}

export async function getAsset(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.assets).where(eq(schema.assets.id, id)).limit(1);
  return row ?? null;
}

/** Returns the asset id if the url points at one of our stored assets (relative or same-origin). */
export function assetIdFromUrl(url: string, origin?: string): string | null {
  try {
    const u = new URL(url, origin ?? "http://local");
    if (origin && u.origin !== new URL(origin).origin && !url.startsWith("/")) return null;
    return u.pathname.startsWith(ASSET_PREFIX) ? u.pathname.slice(ASSET_PREFIX.length) : null;
  } catch {
    return null;
  }
}
