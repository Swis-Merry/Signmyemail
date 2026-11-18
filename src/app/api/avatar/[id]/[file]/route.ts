import { getAsset } from "@/lib/assets";
import { clampAvatarSize, pngResponse, renderAvatar } from "@/lib/images";

export const runtime = "nodejs";

/** Static-looking avatar URL for email clients: /api/avatar/<assetId>/<size>-<shape>.png */
export async function GET(_req: Request, { params }: { params: { id: string; file: string } }) {
  const m = /^(\d+)-(circle|rounded|square)\.png$/.exec(params.file);
  if (!m) return new Response("Not found", { status: 404 });
  const asset = await getAsset(params.id);
  if (!asset) return new Response("Not found", { status: 404 });
  return pngResponse(await renderAvatar(asset.bytes, clampAvatarSize(m[1]), m[2]), "photo.png");
}
