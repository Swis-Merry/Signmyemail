import { NextResponse } from "next/server";
import { apiUser, badRequest, unauthorized } from "@/lib/api";
import { MAX_ASSET_BYTES } from "@/lib/assets";
import { findSignatureForPhoto, setPhoto } from "@/lib/bulk";

/** Form data: file (named by email, email name part, or full name). Admin only. */
export async function POST(req: Request) {
  const user = await apiUser();
  if (!user || user.role !== "admin") return unauthorized();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("No file uploaded");
  if (!file.type.startsWith("image/")) return badRequest("Not an image");
  if (file.size > MAX_ASSET_BYTES) return badRequest("Image must be under 4 MB");
  const sig = await findSignatureForPhoto(file.name);
  if (!sig) return NextResponse.json({ error: "No matching signature" }, { status: 404 });
  const result = await setPhoto(sig.id, Buffer.from(await file.arrayBuffer())).catch(() => null);
  return result ? NextResponse.json(result) : badRequest("Could not read this image");
}
