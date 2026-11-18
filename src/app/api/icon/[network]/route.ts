import { pngResponse, renderIcon } from "@/lib/images";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { network: string } }) {
  const { searchParams } = new URL(req.url);
  return pngResponse(await renderIcon(params.network, searchParams.get("color"), searchParams.get("shape")));
}
