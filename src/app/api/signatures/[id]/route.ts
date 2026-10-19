import { NextResponse } from "next/server";
import { apiUser, badRequest, notFound, parseSignatureData, unauthorized } from "@/lib/api";
import { deleteSignature, getSignature, updateSignature } from "@/lib/signatures";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  if (!(await apiUser())) return unauthorized();
  const sig = await getSignature(params.id);
  return sig ? NextResponse.json(sig) : notFound();
}

export async function PUT(req: Request, { params }: Params) {
  if (!(await apiUser())) return unauthorized();
  if (!(await getSignature(params.id))) return notFound();
  const data = parseSignatureData(await req.json().catch(() => null));
  if (!data) return badRequest("Invalid signature data");
  await updateSignature(params.id, data);
  return NextResponse.json({ id: params.id });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await apiUser())) return unauthorized();
  await deleteSignature(params.id);
  return NextResponse.json({ ok: true });
}
