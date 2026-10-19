import { notFound } from "@/lib/api";
import { getGeneratorBySlug } from "@/lib/generators";
import { handleUpload } from "@/lib/upload";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const gen = await getGeneratorBySlug(params.slug);
  if (!gen || !gen.isActive || !gen.editableFields.includes("avatarUrl")) return notFound();
  return handleUpload(req);
}
