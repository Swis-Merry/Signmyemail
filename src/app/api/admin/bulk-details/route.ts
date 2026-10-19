import { NextResponse } from "next/server";
import { apiUser, badRequest, unauthorized } from "@/lib/api";
import { bulkUpdateDetails, type DetailsRow } from "@/lib/bulk";

export const maxDuration = 60;

/** Body: { rows: { email, jobTitle?, mobile? }[] }. Admin only. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (!user || user.role !== "admin") return unauthorized();
  const body = (await req.json().catch(() => null)) as { rows?: DetailsRow[] } | null;
  if (!Array.isArray(body?.rows) || !body.rows.length) return badRequest("No rows found");
  return NextResponse.json(await bulkUpdateDetails(body.rows));
}
