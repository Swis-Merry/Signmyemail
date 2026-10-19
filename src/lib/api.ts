import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type { SignatureData } from "@/lib/signature/types";

export async function apiUser() {
  return getSession();
}

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
export const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
export const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

export function parseSignatureData(body: unknown): SignatureData | null {
  if (!body || typeof body !== "object") return null;
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const d = data as Partial<SignatureData>;
  if (!d.details || !d.design || !Array.isArray(d.socials) || !Array.isArray(d.addons)) return null;
  return d as SignatureData;
}
