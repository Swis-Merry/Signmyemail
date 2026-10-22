import { businessCardPdf } from "@/lib/businessCard";
import { getSignatureByToken } from "@/lib/signatures";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const sig = await getSignatureByToken(params.token);
  if (!sig) return new Response("Not found", { status: 404 });
  const pdf = await businessCardPdf(sig.data);
  const name = sig.name.replace(/[^\w-]+/g, "_") || "business_card";
  return new Response(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}_business_card.pdf"` },
  });
}
