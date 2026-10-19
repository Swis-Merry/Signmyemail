import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "session";

export interface Session extends JWTPayload {
  sub: string;
  name: string;
  email: string;
  role: "admin" | "member";
}

export function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret || "local-dev-secret-not-for-production");
}

export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    return payload as Session;
  } catch {
    return null;
  }
}

export async function createSession(user: { id: string; name: string; email: string; role: "admin" | "member" }) {
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(authSecret());
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession() {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.role !== "admin") redirect("/dashboard");
  return session;
}
