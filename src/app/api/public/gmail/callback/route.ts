import { NextResponse } from "next/server";
import { appOrigin, exchangeCode, primaryAddress, readState, setOwnSignature } from "@/lib/googleOAuth";
import { renderSignature } from "@/lib/signature/render";
import { getSignatureByEmail, getSignatureByToken, markGmailSynced } from "@/lib/signatures";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = appOrigin(req);
  const params = new URL(req.url).searchParams;
  let token: string | null = null;
  const fail = (msg: string) =>
    NextResponse.redirect(`${origin}${token ? `/s/${token}` : "/install"}?gmail=error&msg=${encodeURIComponent(msg)}`);

  try {
    token = (await readState(params.get("state") || "")).token;
  } catch {
    return fail("That sign-in link expired. Please try again.");
  }
  const code = params.get("code");
  if (params.get("error") || !code) return fail("Google sign-in was cancelled.");

  try {
    const accessToken = await exchangeCode(origin, code);
    const address = await primaryAddress(accessToken);
    const sig = token ? await getSignatureByToken(token) : await getSignatureByEmail(address);
    if (!sig) return fail(`No signature found for ${address}. Ask Marketing to create one for you.`);
    if (sig.email.trim().toLowerCase() !== address) {
      return fail(`This signature is for ${sig.email}, but you signed in as ${address}.`);
    }
    await setOwnSignature(accessToken, address, renderSignature(sig.data, { baseUrl: origin }));
    await markGmailSynced(sig.id);
    return NextResponse.redirect(`${origin}/s/${sig.publicToken}?gmail=ok`);
  } catch (e) {
    return fail((e as Error).message || "Could not install the signature.");
  }
}
