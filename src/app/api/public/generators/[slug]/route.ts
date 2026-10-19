import { NextResponse } from "next/server";
import { badRequest, notFound, parseSignatureData } from "@/lib/api";
import { applyGeneratorInput, getGeneratorBySlug } from "@/lib/generators";
import { createSignature, getSignature } from "@/lib/signatures";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const gen = await getGeneratorBySlug(params.slug);
  if (!gen || !gen.isActive) return notFound();
  const input = parseSignatureData(await req.json().catch(() => null));
  if (!input) return badRequest("Invalid data");
  const data = applyGeneratorInput(gen.data, gen.editableFields, input);
  if (!data.details.name.trim()) return badRequest("Please enter your name.");
  const id = await createSignature({ data, generatorId: gen.id, ownerId: gen.ownerId });
  const sig = await getSignature(id);
  return NextResponse.json({ token: sig?.publicToken });
}
