import { NextResponse } from "next/server";
import { apiUser, badRequest, notFound, unauthorized } from "@/lib/api";
import { applyThemeToAll } from "@/lib/bulk";

export const maxDuration = 60;

/** Body: { sourceId }. Copies that signature's theme onto every other signature. Admin only. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (!user || user.role !== "admin") return unauthorized();
  const body = (await req.json().catch(() => null)) as { sourceId?: string } | null;
  if (!body?.sourceId) return badRequest("Pick a signature to copy the theme from");
  const result = await applyThemeToAll(body.sourceId);
  return result ? NextResponse.json(result) : notFound();
}
