import { renderSignature } from "@/lib/signature/render";
import { getSignatureByToken } from "@/lib/signatures";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const sig = await getSignatureByToken(params.token);
  if (!sig) return new Response("Not found", { status: 404 });
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const body = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${sig.name}</title></head><body>${renderSignature(sig.data, { baseUrl: base })}</body></html>`;
  const name = sig.name.replace(/[^\w-]+/g, "_") || "signature";
  return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.html"` } });
}
