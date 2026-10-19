import { NextResponse } from "next/server";
import { apiUser, badRequest, parseSignatureData, unauthorized } from "@/lib/api";
import { createGenerator, DEFAULT_EDITABLE } from "@/lib/generators";

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const data = parseSignatureData(body);
  if (!data) return badRequest("Invalid signature data");
  const id = await createGenerator(
    {
      name: String(body.name || "Untitled generator"),
      slug: body.slug ? String(body.slug) : undefined,
      data,
      editableFields: Array.isArray(body.editableFields) ? body.editableFields.map(String) : DEFAULT_EDITABLE,
      isActive: body.isActive !== false,
    },
    user.sub,
  );
  return NextResponse.json({ id });
}
