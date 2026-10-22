import { NextResponse } from "next/server";
import { apiUser, unauthorized } from "@/lib/api";
import { pushGmailSignature } from "@/lib/google";
import { renderSignature } from "@/lib/signature/render";
import { getSignature, listSignatures, markGmailSynced } from "@/lib/signatures";

export const maxDuration = 300;

export async function POST(req: Request) {
  if (!(await apiUser())) return unauthorized();
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const rows = (await listSignatures()).filter((r) => r.email);
  const failures: { email: string; error: string }[] = [];
  let ok = 0;
  for (const row of rows) {
    const sig = await getSignature(row.id);
    if (!sig) continue;
    try {
      await pushGmailSignature(sig.email, renderSignature(sig.data, { baseUrl: base, publicToken: sig.publicToken }));
      await markGmailSynced(sig.id);
      ok++;
    } catch (e) {
      failures.push({ email: sig.email, error: (e as Error).message });
    }
  }
  return NextResponse.json({ ok, failed: failures.length, failures: failures.slice(0, 50) });
}
