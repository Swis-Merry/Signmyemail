import { NextResponse } from "next/server";
import { apiUser, notFound, unauthorized } from "@/lib/api";
import { duplicateSignature } from "@/lib/signatures";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const id = await duplicateSignature(params.id, user.sub);
  return id ? NextResponse.json({ id }) : notFound();
}
