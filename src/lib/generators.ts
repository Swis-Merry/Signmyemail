import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb, schema } from "@/lib/db";
import { normalizeSignatureData } from "@/lib/signature/defaults";
import type { SignatureData } from "@/lib/signature/types";

const { generators } = schema;

export const EDITABLE_FIELD_OPTIONS = [
  { id: "name", label: "Full name" },
  { id: "jobTitle", label: "Job title" },
  { id: "company", label: "Company" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "mobile", label: "Mobile" },
  { id: "website", label: "Website" },
  { id: "fax", label: "Fax" },
  { id: "address", label: "Address" },
  { id: "avatarUrl", label: "Photo" },
  { id: "socials", label: "Social links (URLs)" },
] as const;

export const DEFAULT_EDITABLE = ["name", "jobTitle", "email", "mobile", "avatarUrl", "socials"];

export interface GeneratorInput {
  name: string;
  slug?: string;
  data: SignatureData;
  editableFields: string[];
  isActive: boolean;
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || nanoid(8).toLowerCase();
}

export async function listGenerators() {
  const db = await getDb();
  return db.select().from(generators).orderBy(generators.name);
}

export async function getGenerator(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(generators).where(eq(generators.id, id)).limit(1);
  return row ? { ...row, data: normalizeSignatureData(row.data) } : null;
}

export async function getGeneratorBySlug(slug: string) {
  const db = await getDb();
  const [row] = await db.select().from(generators).where(eq(generators.slug, slug)).limit(1);
  return row ? { ...row, data: normalizeSignatureData(row.data) } : null;
}

async function uniqueSlug(base: string, exceptId?: string) {
  const db = await getDb();
  let slug = slugify(base);
  for (let i = 0; i < 20; i++) {
    const [hit] = await db.select({ id: generators.id }).from(generators).where(eq(generators.slug, slug)).limit(1);
    if (!hit || hit.id === exceptId) return slug;
    slug = `${slugify(base)}-${nanoid(4).toLowerCase()}`;
  }
  return nanoid(10).toLowerCase();
}

export async function createGenerator(input: GeneratorInput, ownerId: string) {
  const db = await getDb();
  const id = nanoid(12);
  await db.insert(generators).values({
    id,
    ownerId,
    name: input.name.trim() || "Untitled generator",
    slug: await uniqueSlug(input.slug || input.name),
    data: normalizeSignatureData(input.data),
    editableFields: input.editableFields,
    isActive: input.isActive,
  });
  return id;
}

export async function updateGenerator(id: string, input: GeneratorInput) {
  const db = await getDb();
  await db
    .update(generators)
    .set({
      name: input.name.trim() || "Untitled generator",
      slug: await uniqueSlug(input.slug || input.name, id),
      data: normalizeSignatureData(input.data),
      editableFields: input.editableFields,
      isActive: input.isActive,
      updatedAt: new Date(),
    })
    .where(eq(generators.id, id));
}

export async function deleteGenerator(id: string) {
  const db = await getDb();
  await db.delete(generators).where(eq(generators.id, id));
}

/** Apply employee-entered values onto the locked generator template. */
export function applyGeneratorInput(base: SignatureData, editable: string[], input: SignatureData): SignatureData {
  const out = structuredClone(base);
  for (const f of editable) {
    if (f === "socials") {
      out.socials = out.socials.map((s) => ({ ...s, url: input.socials.find((x) => x.network === s.network)?.url ?? s.url }));
    } else if (f in out.details && f !== "customFields") {
      const key = f as Exclude<keyof SignatureData["details"], "customFields">;
      out.details[key] = String(input.details[key] ?? "").slice(0, 500);
    }
  }
  return out;
}
