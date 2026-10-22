import fs from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import QRCode from "qrcode";
import { ICON, LOGO } from "@/lib/card/logo";
import type { SignatureData } from "@/lib/signature/types";

const MM = 72 / 25.4;
const W = 90 * MM;
const H = 50 * MM;
const BRAND = rgb(0xab / 255, 0x98 / 255, 0x89 / 255);
const WHITE = rgb(1, 1, 1);

const QR_URL = "https://linktr.ee/qr/31ba61f3-bc51-432a-8d9b-1ade3a454c5d?utm_source=qr_code";
const HQ_LINE = "Park Heights Square 2 | Offices 401-402, 405-406 | Dubai Hills Estate | Dubai";
const CONTACT_LINE = "Toll Free: 800-37373 | hello@drehomes.com | P.O. Box 121261";

/** The person's branch address without the trailing country; head-office staff get the printed card's wording. */
export function cardAddress(address: string) {
  const a = address.replace(/\s+/g, " ").trim();
  if (!a || /park heights/i.test(a)) return HQ_LINE;
  return a.replace(/\s*\|\s*UAE$/i, "");
}

const WEIGHTS = [300, 400, 600, 700] as const;
type Weight = (typeof WEIGHTS)[number];
let fontFiles: Promise<Buffer[]> | null = null;

function loadFontFiles() {
  fontFiles ??= Promise.all(WEIGHTS.map((w) => fs.readFile(path.join(process.cwd(), "assets", "card", `clash-grotesk-${w}.ttf`))));
  return fontFiles;
}

const fit = (text: string, font: PDFFont, size: number, max: number) => Math.min(size, (size * max) / Math.max(font.widthOfTextAtSize(text, size), 0.01));

function centered(page: PDFPage, text: string, font: PDFFont, size: number, baselineFromTop: number, color: RGB) {
  if (!text) return;
  page.drawText(text, { x: (W - font.widthOfTextAtSize(text, size)) / 2, y: H - baselineFromTop, size, font, color });
}

/** "Property Associate | BRN 12345" -> "Property Associate" */
export const cardTitle = (jobTitle: string) => jobTitle.split("|")[0].trim();

function drawQr(page: PDFPage, x: number, top: number, size: number) {
  const { modules } = QRCode.create(QR_URL, { errorCorrectionLevel: "H" });
  const n = modules.size;
  const m = size / n;
  const hole = Math.ceil(n * 0.24) | 1;
  const lo = (n - hole) / 2;
  const inHole = (r: number, c: number) => r >= lo && r < lo + hole && c >= lo && c < lo + hole;
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!modules.get(r, c) || inHole(r, c)) { c++; continue; }
      const start = c;
      while (c < n && modules.get(r, c) && !inHole(r, c)) c++;
      page.drawRectangle({ x: x + start * m, y: H - top - (r + 1) * m, width: (c - start) * m, height: m * 1.02, color: WHITE });
    }
  }
  const icon = hole * m * 1.25;
  const s = icon / ICON.size;
  page.drawSvgPath(ICON.d, { x: x + size / 2 - icon / 2, y: H - top - size / 2 + icon / 2, scale: s, color: WHITE });
}

export async function businessCardPdf(data: SignatureData) {
  const d = data.details;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(d.name.trim() || "Business card");
  pdf.setAuthor("DRE");
  const files = await loadFontFiles();
  const embedded = await Promise.all(files.map((b) => pdf.embedFont(b, { subset: true })));
  const f = Object.fromEntries(WEIGHTS.map((w, i) => [w, embedded[i]])) as Record<Weight, PDFFont>;

  // Front: name, title | mobile, email
  const front = pdf.addPage([W, H]);
  const name = d.name.trim().toUpperCase();
  centered(front, name, f[600], fit(name, f[600], 17.5, W - 12 * MM), 25 * MM, BRAND);

  const title = cardTitle(d.jobTitle);
  const phone = d.mobile.trim();
  let size = 7.5;
  const gap = 1.6 * MM;
  const bar = 0.8;
  const width = (s: number) =>
    (title ? f[400].widthOfTextAtSize(title, s) : 0) + (phone ? f[600].widthOfTextAtSize(phone, s) : 0) + (title && phone ? gap * 2 + bar : 0);
  if (width(size) > W - 10 * MM) size = (size * (W - 10 * MM)) / width(size);
  let x = (W - width(size)) / 2;
  const base = H - 30 * MM;
  if (title) {
    front.drawText(title, { x, y: base, size, font: f[400], color: BRAND });
    x += f[400].widthOfTextAtSize(title, size);
  }
  if (title && phone) {
    x += gap;
    front.drawRectangle({ x, y: base - size * 0.12, width: bar, height: size * 0.95, color: BRAND });
    x += bar + gap;
  }
  if (phone) front.drawText(phone, { x, y: base, size, font: f[600], color: BRAND });

  const email = d.email.trim();
  centered(front, email, f[400], fit(email, f[400], 6.8, W - 10 * MM), 44.9 * MM, BRAND);

  // Back: logo, office band, QR
  const back = pdf.addPage([W, H]);
  const lw = 29.4 * MM;
  const ls = lw / LOGO.w;
  const lh = LOGO.h * ls;
  const cy = H - 16.5 * MM;
  back.drawSvgPath(LOGO.d, { x: W / 2 - lw / 2 - LOGO.x * ls, y: cy + lh / 2 + LOGO.y * ls, scale: ls, color: BRAND });

  back.drawRectangle({ x: 0, y: 0, width: W, height: 17 * MM, color: BRAND });
  const textMax = 71.6 * MM - 3.7 * MM - 2 * MM;
  const officeLines = [cardAddress(d.address), CONTACT_LINE];
  const lineSize = Math.min(...officeLines.map((l) => fit(l, f[400], 5.3, textMax)));
  officeLines.forEach((l, i) => back.drawText(l, { x: 3.7 * MM, y: H - (41.1 + i * 2.75) * MM, size: lineSize, font: f[400], color: WHITE }));
  drawQr(back, 71.6 * MM, 34.1 * MM, 15 * MM);

  return pdf.save();
}
