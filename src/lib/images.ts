import sharp from "sharp";
import * as icons from "simple-icons";
import { SOCIAL_NETWORKS } from "@/lib/signature/socials";

export const IMMUTABLE_IMAGE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "CDN-Cache-Control": "public, max-age=31536000, immutable",
};

export function pngResponse(png: Buffer, fileName?: string, headers: Record<string, string> = IMMUTABLE_IMAGE_HEADERS) {
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      ...(fileName ? { "Content-Disposition": `inline; filename="${fileName.replace(/[^\w.-]/g, "_")}"` } : {}),
      ...headers,
    },
  });
}

export function clampAvatarSize(value: string | null | undefined) {
  return Math.min(Math.max(parseInt(value || "100", 10) || 100, 32), 240);
}

export async function renderAvatar(input: Buffer, display: number, shape: string) {
  const size = display * 2;
  const radius = shape === "circle" ? size / 2 : shape === "rounded" ? Math.round(size * 0.12) : 0;
  let img = sharp(input, { density: 300 }).rotate().resize(size, size, { fit: "cover" });
  if (radius) {
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></svg>`);
    img = sharp(await img.png().toBuffer()).composite([{ input: mask, blend: "dest-in" }]);
  }
  return img.png().toBuffer();
}

const ICON_SIZE = 64;
const RADIUS: Record<string, number> = { square: 0, rounded: 14, circle: 32, none: 0 };

// Glyphs for networks not shipped by simple-icons (24x24 viewBox).
const FALLBACK: Record<string, string> = {
  linkedin: "M3.5 9h4v11h-4zM5.5 3a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM10 9h3.8v1.6c.6-1.1 2-1.9 3.9-1.9 3.6 0 4.3 2.4 4.3 5.4V20h-4v-5.1c0-1.4-.1-3-1.9-3-1.9 0-2.1 1.4-2.1 2.9V20h-4z",
};
const EVENODD: Record<string, string> = {
  card: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 7v10h16V7zM8.5 8.7a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM5.5 15.5c0-1.7 1.4-2.6 3-2.6s3 .9 3 2.6zM13 9.5h5v1.3h-5zM13 12h5v1.3h-5zM13 14.5h3.5v1.3H13z",
};
const GENERIC = "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10z";

function iconPath(network: string): string {
  const key = "si" + network.charAt(0).toUpperCase() + network.slice(1);
  const icon = (icons as unknown as Record<string, { path: string } | undefined>)[key];
  return icon?.path ?? FALLBACK[network] ?? EVENODD[network] ?? GENERIC;
}

export async function renderIcon(networkParam: string, colorParam: string | null, shapeParam: string | null) {
  const network = networkParam.toLowerCase();
  const net = SOCIAL_NETWORKS[network];
  const color = "#" + (colorParam || net?.color.slice(1) || "555555").replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  const shape = shapeParam || "circle";
  const filled = shape !== "none";
  const glyph = filled ? 34 : 56;
  const offset = (ICON_SIZE - glyph) / 2;
  const bg = filled ? `<rect width="${ICON_SIZE}" height="${ICON_SIZE}" rx="${RADIUS[shape] ?? 32}" fill="${color}"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}">${bg}<g transform="translate(${offset} ${offset}) scale(${glyph / 24})"><path d="${iconPath(network)}"${EVENODD[network] ? ' fill-rule="evenodd"' : ""} fill="${filled ? "#ffffff" : color}"/></g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Email clients only reliably show PNG/JPEG/GIF; convert anything else (e.g. WebP), or anything when PNG is required, to PNG. */
export async function emailSafeImage(bytes: Buffer, contentType: string, required?: "image/png") {
  if (required ? contentType === required : ["image/png", "image/jpeg", "image/gif"].includes(contentType)) return { bytes, contentType };
  return { bytes: await sharp(bytes).png().toBuffer(), contentType: "image/png" };
}
