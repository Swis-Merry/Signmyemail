import { NextResponse } from "next/server";
import { appOrigin, authorizeUrl, oauthConfigured } from "@/lib/googleOAuth";
import { getSignatureByToken } from "@/lib/signatures";

export const dynamic = "force-dynamic";

/** Starts Google sign-in. `?token=` installs that signature; without it, the signature matching the Google account's email is used. */
export async function GET(req: Request) {
  const origin = appOrigin(req);
  const token = new URL(req.url).searchParams.get("token") || undefined;
  const sig = token ? await getSignatureByToken(token) : null;
  const back = sig ? `/s/${sig.publicToken}` : "/install";
  if (!oauthConfigured()) {
    return NextResponse.redirect(`${origin}${back}?gmail=error&msg=${encodeURIComponent("Gmail install is not set up yet.")}`);
  }
  return NextResponse.redirect(await authorizeUrl(origin, { token: sig?.publicToken, loginHint: sig?.email || undefined }));
}
