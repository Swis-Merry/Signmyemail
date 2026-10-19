import { NextResponse } from "next/server";
import { apiUser, badRequest, unauthorized } from "@/lib/api";
import { importLegacy, type LegacyListRow, type LegacyRecord } from "@/lib/legacyImport";

export const maxDuration = 60;

/** Body: { signatures: LegacyRecord[]; dashboard: LegacyListRow[] }. Admin only; safe to re-run. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (!user || user.role !== "admin") return unauthorized();
  const body = (await req.json().catch(() => null)) as { signatures?: LegacyRecord[]; dashboard?: LegacyListRow[] } | null;
  if (!Array.isArray(body?.signatures) || !body.signatures.length || !Array.isArray(body.dashboard)) {
    return badRequest("Expected { signatures: [...], dashboard: [...] }");
  }
  return NextResponse.json(await importLegacy(body.signatures, body.dashboard));
}
