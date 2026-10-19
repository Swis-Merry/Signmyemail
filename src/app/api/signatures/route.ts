import { NextResponse } from "next/server";
import { apiUser, badRequest, parseSignatureData, unauthorized } from "@/lib/api";
import { createSignature } from "@/lib/signatures";

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const data = parseSignatureData(await req.json().catch(() => null));
  if (!data) return badRequest("Invalid signature data");
  const id = await createSignature({ data, ownerId: user.sub });
  return NextResponse.json({ id });
}
