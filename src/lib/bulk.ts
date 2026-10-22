import sharp from "sharp";
import { saveAsset } from "@/lib/assets";
import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/signature/defaults";
import type { SignatureData } from "@/lib/signature/types";
import { getSignature, getSignatureByEmail, listSignatures, updateSignature } from "@/lib/signatures";

const PERSONAL = ["name", "email", "jobTitle", "mobile", "avatarUrl", "address"] as const;

export function whatsappUrl(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  return digits ? `https://web.whatsapp.com/send?phone=${digits}` : "";
}

/** The source's design, add-ons, company lines and shared social links, with the target's personal fields (incl. branch address) and WhatsApp. */
export function applyTheme(source: SignatureData, target: SignatureData): SignatureData {
  const out = structuredClone(source);
  for (const k of PERSONAL) out.details[k] = target.details[k];
  out.socials = [...target.socials.filter((s) => s.network === "whatsapp"), ...source.socials.filter((s) => s.network !== "whatsapp")];
  return out;
}

export async function applyThemeToAll(sourceId: string) {
  const source = await getSignature(sourceId);
  if (!source) return null;
  const db = await getDb();
  const rows = await db.select({ id: schema.signatures.id, data: schema.signatures.data }).from(schema.signatures);
  let updated = 0;
  for (const row of rows) {
    if (row.id === sourceId) continue;
    await updateSignature(row.id, applyTheme(source.data, row.data));
    updated++;
  }
  return { updated };
}

function setMobile(data: SignatureData, mobile: string) {
  data.details.mobile = mobile;
  const url = whatsappUrl(mobile);
  const wa = data.socials.find((s) => s.network === "whatsapp");
  if (wa) wa.url = url;
  else if (url) data.socials.unshift({ id: newId(), network: "whatsapp", url });
}

export interface DetailsRow {
  email: string;
  jobTitle?: string;
  mobile?: string;
}

/** Fills in job title / mobile by email. Empty cells leave the existing value alone. */
export async function bulkUpdateDetails(rows: DetailsRow[]) {
  let updated = 0;
  const notFound: string[] = [];
  for (const row of rows) {
    const email = (row.email || "").trim().toLowerCase();
    if (!email) continue;
    const sig = await getSignatureByEmail(email);
    if (!sig) {
      notFound.push(email);
      continue;
    }
    const data = sig.data;
    if (row.jobTitle?.trim()) data.details.jobTitle = row.jobTitle.trim();
    if (row.mobile?.trim()) setMobile(data, row.mobile.trim());
    await updateSignature(sig.id, data);
    updated++;
  }
  return { updated, notFound };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Matches a photo file name to a signature: full email, email name part, or full name. */
export async function findSignatureForPhoto(fileName: string) {
  const base = fileName.replace(/\.[a-z0-9]+$/i, "").trim().toLowerCase();
  if (base.includes("@")) return getSignatureByEmail(base);
  const key = norm(base);
  if (!key) return null;
  const all = await listSignatures();
  const byLocal = all.filter((s) => norm(s.email.split("@")[0]) === key);
  const matches = byLocal.length ? byLocal : all.filter((s) => norm(s.name) === key);
  return matches.length === 1 ? getSignature(matches[0].id) : null;
}

export async function setPhoto(id: string, bytes: Buffer) {
  const sig = await getSignature(id);
  if (!sig) return null;
  const png = await sharp(bytes).rotate().resize(300, 300, { fit: "cover", position: "attention" }).png().toBuffer();
  const { url } = await saveAsset(png, "image/png");
  sig.data.details.avatarUrl = url;
  await updateSignature(id, sig.data);
  return { name: sig.name, email: sig.email, url };
}
