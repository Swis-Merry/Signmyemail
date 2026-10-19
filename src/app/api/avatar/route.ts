import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { assetIdFromUrl, getAsset } from "@/lib/assets";

export const runtime = "nodejs";

function isAllowedRemote(src: string) {
  try {
    const u = new URL(src);
    return u.protocol === "https:" && !/^[\d.]+$/.test(u.hostname) && !u.hostname.includes(":") && u.hostname !== "localhost";
  } catch {
    return false;
  }
}

async function loadSource(src: string, origin: string): Promise<Buffer | null> {
  const assetId = assetIdFromUrl(src, origin);
  if (assetId) return (await getAsset(assetId))?.bytes ?? null;
  if (src.startsWith(origin + "/")) {
    const rel = decodeURIComponent(new URL(src).pathname).replace(/^\/+/, "");
    const file = path.join(process.cwd(), "public", rel);
    if (!file.startsWith(path.join(process.cwd(), "public"))) return null;
    return readFile(file).catch(() => null);
  }
  if (!isAllowedRemote(src)) return null;
  const res = await fetch(src, { redirect: "follow" }).catch(() => null);
  if (!res?.ok || !(res.headers.get("content-type") || "").startsWith("image/")) return null;
  return Buffer.from(await res.arrayBuffer());
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const src = url.searchParams.get("src") || "";
  const display = Math.min(Math.max(parseInt(url.searchParams.get("size") || "100", 10) || 100, 32), 240);
  const shape = url.searchParams.get("shape") || "circle";
  const size = display * 2;
  const input = await loadSource(src, url.origin);
  if (!input) return new Response("Invalid image source", { status: 400 });

  const radius = shape === "circle" ? size / 2 : shape === "rounded" ? Math.round(size * 0.12) : 0;
  let img = sharp(input, { density: 300 }).resize(size, size, { fit: "cover" });
  if (radius) {
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></svg>`);
    img = sharp(await img.png().toBuffer()).composite([{ input: mask, blend: "dest-in" }]);
  }
  const png = await img.png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
}
