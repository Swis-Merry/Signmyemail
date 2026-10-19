import { NextResponse } from "next/server";
import { MAX_ASSET_BYTES, saveAsset } from "@/lib/assets";

const ALLOWED = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export async function handleUpload(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Use a PNG, JPG, GIF or WebP image" }, { status: 400 });
  if (file.size > MAX_ASSET_BYTES) return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 400 });
  const { url } = await saveAsset(Buffer.from(await file.arrayBuffer()), file.type);
  return NextResponse.json({ url });
}
