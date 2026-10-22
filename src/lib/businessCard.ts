import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import sharp from "sharp";
import { assetIdFromUrl, getAsset } from "@/lib/assets";
import type { SignatureData } from "@/lib/signature/types";

const MM = 72 / 25.4;
const W = 90 * MM;
const H = 50 * MM;

function hex(c: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  const n = m ? parseInt(m[1], 16) : 0xab9889;
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Standard PDF fonts only cover WinAnsi; drop anything else instead of throwing. */
const safe = (s: string) => s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "").trim();

async function loadImage(src: string, origin: string): Promise<Buffer | null> {
  if (!src) return null;
  const id = assetIdFromUrl(src, origin);
  if (id) return (await getAsset(id))?.bytes ?? null;
  try {
    const u = new URL(src, origin);
    if (u.protocol !== "https:") return null;
    const res = await fetch(u, { redirect: "follow" });
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

async function circlePhoto(bytes: Buffer, px: number) {
  const mask = Buffer.from(`<svg width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}"/></svg>`);
  return sharp(bytes).resize(px, px, { fit: "cover", position: "attention" }).grayscale().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

function fit(text: string, font: PDFFont, size: number, max: number) {
  let s = size;
  while (s > 4 && font.widthOfTextAtSize(text, s) > max) s -= 0.25;
  return s;
}

function line(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = rgb(0.15, 0.15, 0.15), max = W - x - 6 * MM) {
  const t = safe(text);
  if (!t) return;
  page.drawText(t, { x, y, font, size: fit(t, font, size, max), color });
}

export async function businessCardPdf(data: SignatureData, origin: string) {
  const d = data.details;
  const brand = hex(data.design.primaryColor);
  const pdf = await PDFDocument.create();
  pdf.setTitle(safe(d.name) || "Business card");
  pdf.setAuthor("DRE");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const banner = data.addons.find((a) => a.type === "banner");

  const front = pdf.addPage([W, H]);
  const photo = await loadImage(d.avatarUrl, origin);
  let x = 6 * MM;
  if (photo) {
    const img = await pdf.embedPng(await circlePhoto(photo, 400).catch(() => null) ?? Buffer.alloc(0)).catch(() => null);
    if (img) {
      const s = 24 * MM;
      front.drawImage(img, { x, y: H - 7 * MM - s, width: s, height: s });
      x += s + 4 * MM;
    }
  }
  front.drawRectangle({ x: x - 2 * MM, y: 8 * MM, width: 0.6, height: H - 16 * MM, color: brand });
  let y = H - 11 * MM;
  line(front, d.name, x, y, regular, 12, brand);
  y -= 4.5 * MM;
  line(front, d.jobTitle, x, y, bold, 7);
  y -= 6 * MM;
  const rows: [string, string][] = [
    ["M:", d.mobile],
    ["E:", d.email],
    ["W:", d.website],
    ...d.customFields.filter((f) => f.value).map((f): [string, string] => [`${f.label}:`, f.value]),
    ["A:", d.address],
  ];
  for (const [label, value] of rows) {
    if (!safe(value)) continue;
    line(front, label, x, y, bold, 6, brand);
    line(front, value, x + bold.widthOfTextAtSize(label, 6) + 1.5, y, regular, 6);
    y -= 3.6 * MM;
    if (y < 4 * MM) break;
  }

  const back = pdf.addPage([W, H]);
  back.drawRectangle({ x: 0, y: 0, width: W, height: H, color: brand });
  const bannerBytes = banner ? await loadImage(banner.imageUrl, origin) : null;
  if (bannerBytes) {
    const png = await sharp(bannerBytes).png().toBuffer().catch(() => null);
    const img = png ? await pdf.embedPng(png).catch(() => null) : null;
    if (img) {
      const w = W - 8 * MM;
      const h = (img.height / img.width) * w;
      back.drawImage(img, { x: 4 * MM, y: (H - h) / 2, width: w, height: h });
    }
  }
  return pdf.save();
}
