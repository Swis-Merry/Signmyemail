import { readFile } from "fs/promises";
import path from "path";
import { assetIdFromUrl, getAsset } from "@/lib/assets";
import { clampAvatarSize, pngResponse, renderAvatar } from "@/lib/images";

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
  const display = clampAvatarSize(url.searchParams.get("size"));
  const shape = url.searchParams.get("shape") || "circle";
  const input = await loadSource(src, url.origin);
  if (!input) return new Response("Invalid image source", { status: 400 });
  return pngResponse(await renderAvatar(input, display, shape), "photo.png", { "Cache-Control": "public, max-age=86400" });
}
