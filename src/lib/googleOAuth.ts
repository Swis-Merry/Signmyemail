import { SignJWT, jwtVerify } from "jose";
import { authSecret } from "@/lib/auth";
import { workspaceDomain } from "@/lib/google";

const SCOPE = "https://www.googleapis.com/auth/gmail.settings.basic";
const STATE_TYPE = "gmail-oauth";

/** Per-employee Gmail install: each person signs in with Google and approves; no Workspace admin needed. */
export function oauthConfigured() {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

export function appOrigin(req: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
}

export const redirectUri = (origin: string) => `${origin}/api/public/gmail/callback`;

export async function authorizeUrl(origin: string, opts: { token?: string; loginHint?: string }) {
  const state = await new SignJWT({ typ: STATE_TYPE, t: opts.token ?? "" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(authSecret());
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: SCOPE,
    access_type: "online",
    prompt: "select_account",
    state,
  });
  const domain = workspaceDomain();
  if (domain) params.set("hd", domain);
  if (opts.loginHint) params.set("login_hint", opts.loginHint);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function readState(state: string) {
  const { payload } = await jwtVerify(state, authSecret());
  if (payload.typ !== STATE_TYPE) throw new Error("Invalid state");
  return { token: typeof payload.t === "string" && payload.t ? payload.t : null };
}

async function google<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as { error?: string | { message?: string }; error_description?: string };
  if (!res.ok) {
    const e = json.error;
    throw new Error((typeof e === "string" ? json.error_description || e : e?.message) || `Google request failed (${res.status})`);
  }
  return json as T;
}

export async function exchangeCode(origin: string, code: string) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    redirect_uri: redirectUri(origin),
    grant_type: "authorization_code",
  });
  const json = await google<{ access_token: string }>("https://oauth2.googleapis.com/token", { method: "POST", body });
  return json.access_token;
}

const SEND_AS = "https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs";

export async function primaryAddress(accessToken: string) {
  const json = await google<{ sendAs?: { sendAsEmail: string; isPrimary?: boolean }[] }>(SEND_AS, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const primary = json.sendAs?.find((s) => s.isPrimary) ?? json.sendAs?.[0];
  if (!primary) throw new Error("Could not read your Gmail address.");
  return primary.sendAsEmail.toLowerCase();
}

export async function setOwnSignature(accessToken: string, address: string, html: string) {
  await google(`${SEND_AS}/${encodeURIComponent(address)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ signature: html }),
  });
}
