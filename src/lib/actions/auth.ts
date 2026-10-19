"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { clearSession, createSession, getSession } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

export async function loginAction(_prev: { error?: string } | undefined, form: FormData) {
  const email = String(form.get("email") || "").toLowerCase().trim();
  const password = String(form.get("password") || "");
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  await createSession(user);
  redirect("/dashboard");
}

export async function logoutAction() {
  clearSession();
  redirect("/login");
}

export async function changePasswordAction(_prev: { error?: string; ok?: boolean } | undefined, form: FormData) {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };
  const current = String(form.get("current") || "");
  const next = String(form.get("next") || "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, session.sub)).limit(1);
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { error: "Current password is incorrect." };
  await db.update(schema.users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(schema.users.id, user.id));
  return { ok: true };
}
