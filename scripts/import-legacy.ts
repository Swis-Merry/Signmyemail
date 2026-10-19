/**
 * Imports signatures exported from the previous signature provider.
 *
 *   npx tsx scripts/import-legacy.ts <dir>
 *
 * <dir> must contain:
 *   signatures.json      full records (array) — at least one, used as the company base
 *   dashboard_list.json  [{ id, name, email }] for every signature
 * Records without full data get the company base with their own name/email and empty personal fields.
 */
import { readFileSync } from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { saveAsset } from "../src/lib/assets";
import { getDb, schema } from "../src/lib/db";
import { createGenerator, DEFAULT_EDITABLE } from "../src/lib/generators";
import { defaultSignatureData, newId, normalizeSignatureData } from "../src/lib/signature/defaults";
import { createSignature } from "../src/lib/signatures";
import type { FontSize, SignatureData } from "../src/lib/signature/types";

interface LegacyRecord {
  id: number;
  basic: Record<string, unknown> & { custom_fields?: { name: string; type: string; value: string }[] | null };
  options: Record<string, string | number>;
  social: { platforms: { type: string; url: string }[] };
  addons: { type: string; data: Record<string, string>; options?: Record<string, string> }[];
}

const dir = process.argv[2] || path.join(process.env.USERPROFILE || process.env.HOME || ".", "research", "export");
const full: LegacyRecord[] = JSON.parse(readFileSync(path.join(dir, "signatures.json"), "utf8"));
const list: { id: number; name: string; email: string }[] = JSON.parse(readFileSync(path.join(dir, "dashboard_list.json"), "utf8"));

const rehosted = new Map<string, string>();
async function rehost(url: unknown): Promise<string> {
  if (typeof url !== "string" || !url) return "";
  if (rehosted.has(url)) return rehosted.get(url)!;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  could not download ${url} (${res.status}); keeping original URL`);
    return url;
  }
  const type = res.headers.get("content-type") || "image/png";
  const { url: local } = await saveAsset(Buffer.from(await res.arrayBuffer()), type, url);
  rehosted.set(url, local);
  return local;
}

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const FONT_SIZES: Record<string, FontSize> = { "11": "sm", "12": "md", "14": "lg", "16": "xl" };
const FIELD_TYPES = new Set(["text", "phone", "email", "url"]);

async function convert(r: LegacyRecord): Promise<SignatureData> {
  const b = r.basic;
  const o = r.options;
  const base = defaultSignatureData();
  const radius = Number(o.avatar_radius ?? 0);
  const banner = r.addons.find((a) => a.type === "banner");
  return normalizeSignatureData({
    details: {
      name: str(b.name),
      jobTitle: str(b.jobTitle),
      company: str(b.company),
      email: str(b.email),
      phone: str(b.phone),
      mobile: str(b.mobile),
      website: str(b.website),
      fax: str(b.fax),
      address: str(b.address),
      avatarUrl: await rehost(b.image),
      customFields: (b.custom_fields || []).map((c) => ({ id: newId(), label: c.name, value: c.value, type: (FIELD_TYPES.has(c.type) ? c.type : "text") as "text" })),
    },
    socials: r.social.platforms.map((pl) => ({ id: newId(), network: pl.type, url: pl.url })),
    design: {
      ...base.design,
      templateId: "classic",
      primaryColor: str(o.color) || base.design.primaryColor,
      secondaryColor: str(o.color_secondary) || base.design.secondaryColor,
      fontFamily: str(o.font_family) || base.design.fontFamily,
      fontSize: FONT_SIZES[str(o.font_size)] ?? base.design.fontSize,
      avatarSize: Number(o.avatar_size) || base.design.avatarSize,
      avatarShape: radius >= 50 ? "circle" : radius > 0 ? "rounded" : "square",
      titleSeparator: (["|", "/", "at", "newline"].includes(str(o.title_separator)) ? str(o.title_separator) : "|") as "|",
      iconStyle: o.social_style === "brand" ? "brand" : "custom",
      iconColor: str(o.social_color) || base.design.iconColor,
      iconShape: Number(o.social_radius ?? 0) >= 50 ? "circle" : "rounded",
      width: Math.max(Number(o.table_width) || 0, Number(banner?.options?.width) || 0, 600),
    },
    addons: banner
      ? [{ id: newId(), type: "banner", imageUrl: await rehost(banner.data.image_url), link: str(banner.data.link), width: Number(banner.options?.width) || 600 }]
      : [],
  });
}

/** Company-wide base: the full record with personal fields cleared. */
function companyBase(d: SignatureData): SignatureData {
  const out = structuredClone(d);
  Object.assign(out.details, { name: "", email: "", jobTitle: "", mobile: "", avatarUrl: "" });
  out.socials = out.socials.filter((s) => s.network !== "whatsapp");
  return out;
}

async function main() {
  const db = await getDb();
  const [admin] = await db.select().from(schema.users).limit(1);
  const byId = new Map(full.map((r) => [r.id, r]));
  const base = companyBase(await convert(full[0]));
  let created = 0;
  let skipped = 0;
  for (const row of list) {
    const [exists] = await db.select({ id: schema.signatures.id }).from(schema.signatures).where(eq(schema.signatures.legacyId, row.id)).limit(1);
    if (exists) {
      skipped++;
      continue;
    }
    const rec = byId.get(row.id);
    let data: SignatureData;
    if (rec) data = await convert(rec);
    else {
      data = structuredClone(base);
      data.details.name = row.name.trim();
      data.details.email = row.email.trim().toLowerCase();
    }
    await createSignature({ data, ownerId: admin?.id ?? null, legacyId: row.id });
    created++;
  }
  const gens = await db.select().from(schema.generators).where(eq(schema.generators.slug, "dre-team")).limit(1);
  if (!gens.length && admin) {
    await createGenerator({ name: "DRE team signature", slug: "dre-team", data: base, editableFields: [...DEFAULT_EDITABLE], isActive: true }, admin.id);
    console.log("created generator /g/dre-team");
  }
  console.log(`imported ${created}, skipped ${skipped} already imported, full data for ${full.length}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
