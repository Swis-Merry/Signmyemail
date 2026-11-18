import { pngResponse, renderIcon } from "@/lib/images";

export const runtime = "nodejs";

/** Static-looking icon URL for email clients: /api/icon/<network>/<color>-<shape>.png */
export async function GET(_req: Request, { params }: { params: { network: string; file: string } }) {
  const m = /^([0-9a-fA-F]{3,6})-(circle|rounded|square|none)\.png$/.exec(params.file);
  if (!m) return new Response("Not found", { status: 404 });
  return pngResponse(await renderIcon(params.network, m[1], m[2]), `${params.network}.png`);
}
