import { desc, eq, ilike, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "@/lib/db";
import { normalizeSignatureData } from "@/lib/signature/defaults";
import type { SignatureData } from "@/lib/signature/types";

const { signatures } = schema;

function summary(data: SignatureData) {
  return { name: data.details.name.trim() || "Untitled signature", email: data.details.email.trim() };
}

export async function listSignatures(q?: string) {
  const db = await getDb();
  const where = q ? or(ilike(signatures.name, `%${q}%`), ilike(signatures.email, `%${q}%`)) : undefined;
  return db
    .select({ id: signatures.id, name: signatures.name, email: signatures.email, generatorId: signatures.generatorId, gmailSyncedAt: signatures.gmailSyncedAt, updatedAt: signatures.updatedAt, publicToken: signatures.publicToken })
    .from(signatures)
    .where(where)
    .orderBy(signatures.name);
}

export async function getSignature(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(signatures).where(eq(signatures.id, id)).limit(1);
  return row ? { ...row, data: normalizeSignatureData(row.data) } : null;
}

export async function getSignatureByToken(token: string) {
  const db = await getDb();
  const [row] = await db.select().from(signatures).where(eq(signatures.publicToken, token)).limit(1);
  return row ? { ...row, data: normalizeSignatureData(row.data) } : null;
}

export async function createSignature(input: { data: SignatureData; ownerId?: string | null; generatorId?: string | null; legacyId?: number }) {
  const db = await getDb();
  const data = normalizeSignatureData(input.data);
  const id = nanoid(12);
  await db.insert(signatures).values({
    id,
    ...summary(data),
    data,
    ownerId: input.ownerId ?? null,
    generatorId: input.generatorId ?? null,
    legacyId: input.legacyId,
    publicToken: nanoid(24),
  });
  return id;
}

export async function updateSignature(id: string, input: SignatureData) {
  const db = await getDb();
  const data = normalizeSignatureData(input);
  await db.update(signatures).set({ ...summary(data), data, updatedAt: new Date() }).where(eq(signatures.id, id));
}

export async function deleteSignature(id: string) {
  const db = await getDb();
  await db.delete(signatures).where(eq(signatures.id, id));
}

export async function duplicateSignature(id: string, ownerId: string) {
  const sig = await getSignature(id);
  if (!sig) return null;
  const data = structuredClone(sig.data);
  data.details.name = `${data.details.name} (copy)`;
  return createSignature({ data, ownerId, generatorId: sig.generatorId });
}

export async function markGmailSynced(id: string) {
  const db = await getDb();
  await db.update(signatures).set({ gmailSyncedAt: new Date() }).where(eq(signatures.id, id));
}

export async function recentSignatures(limit = 5) {
  const db = await getDb();
  return db.select().from(signatures).orderBy(desc(signatures.updatedAt)).limit(limit);
}
