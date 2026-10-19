import sharp from "sharp";
import * as icons from "simple-icons";
import { SOCIAL_NETWORKS } from "@/lib/signature/socials";

export const runtime = "nodejs";

const SIZE = 64;
const RADIUS: Record<string, number> = { square: 0, rounded: 14, circle: 32, none: 0 };

// Glyphs for networks not shipped by simple-icons (24x24 viewBox).
const FALLBACK: Record<string, string> = {
  linkedin: "M3.5 9h4v11h-4zM5.5 3a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM10 9h3.8v1.6c.6-1.1 2-1.9 3.9-1.9 3.6 0 4.3 2.4 4.3 5.4V20h-4v-5.1c0-1.4-.1-3-1.9-3-1.9 0-2.1 1.4-2.1 2.9V20h-4z",
};
const GENERIC = "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10z";

function iconPath(network: string): string {
  const key = "si" + network.charAt(0).toUpperCase() + network.slice(1);
  const icon = (icons as unknown as Record<string, { path: string } | undefined>)[key];
  return icon?.path ?? FALLBACK[network] ?? GENERIC;
}

export async function GET(req: Request, { params }: { params: { network: string } }) {
  const { searchParams } = new URL(req.url);
  const network = params.network.toLowerCase();
  const net = SOCIAL_NETWORKS[network];
  const color = "#" + (searchParams.get("color") || net?.color.slice(1) || "555555").replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  const shape = searchParams.get("shape") || "circle";
  const filled = shape !== "none";
  const glyph = filled ? 34 : 56;
  const offset = (SIZE - glyph) / 2;
  const bg = filled ? `<rect width="${SIZE}" height="${SIZE}" rx="${RADIUS[shape] ?? 32}" fill="${color}"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${bg}<g transform="translate(${offset} ${offset}) scale(${glyph / 24})"><path d="${iconPath(network)}" fill="${filled ? "#ffffff" : color}"/></g></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
}
