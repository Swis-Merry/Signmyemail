import { NextResponse } from "next/server";
import { apiUser, badRequest, notFound, parseSignatureData, unauthorized } from "@/lib/api";
import { deleteGenerator, getGenerator, updateGenerator } from "@/lib/generators";

type Params = { params: { id: string } };

export async function PUT(req: Request, { params }: Params) {
  if (!(await apiUser())) return unauthorized();
  const existing = await getGenerator(params.id);
  if (!existing) return notFound();
  const body = await req.json().catch(() => null);
  const data = parseSignatureData(body);
  if (!data) return badRequest("Invalid signature data");
  await updateGenerator(params.id, {
    name: String(body.name || existing.name),
    slug: body.slug ? String(body.slug) : existing.slug,
    data,
    editableFields: Array.isArray(body.editableFields) ? body.editableFields.map(String) : existing.editableFields,
    isActive: body.isActive !== false,
  });
  const updated = await getGenerator(params.id);
  return NextResponse.json({ id: params.id, slug: updated?.slug });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await apiUser())) return unauthorized();
  await deleteGenerator(params.id);
  return NextResponse.json({ ok: true });
}
