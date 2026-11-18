import { getAsset } from "@/lib/assets";
import { emailSafeImage, IMMUTABLE_IMAGE_HEADERS } from "@/lib/images";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const asset = await getAsset(params.id.replace(/\.png$/i, ""));
  if (!asset) return new Response("Not found", { status: 404 });
  const { bytes, contentType } = await emailSafeImage(asset.bytes, asset.contentType);
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": contentType, ...IMMUTABLE_IMAGE_HEADERS } });
}
