import { NextResponse } from "next/server";
import { apiUser, notFound, unauthorized } from "@/lib/api";
import { pushGmailSignature } from "@/lib/google";
import { renderSignature } from "@/lib/signature/render";
import { getSignature, markGmailSynced } from "@/lib/signatures";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await apiUser())) return unauthorized();
  const sig = await getSignature(params.id);
  if (!sig) return notFound();
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  try {
    await pushGmailSignature(sig.email, renderSignature(sig.data, { baseUrl: base }));
    await markGmailSynced(sig.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
