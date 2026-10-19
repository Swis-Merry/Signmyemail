import { notFound } from "next/navigation";
import { GmailConnectButton, GmailResult } from "@/components/GmailConnect";
import InstallView from "@/components/InstallView";
import { APP_NAME } from "@/lib/config";
import { oauthConfigured } from "@/lib/googleOAuth";
import { renderSignature } from "@/lib/signature/render";
import { getSignatureByToken } from "@/lib/signatures";
import { getBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function PublicSignaturePage({ params, searchParams }: { params: { token: string }; searchParams: { gmail?: string; msg?: string } }) {
  const sig = await getSignatureByToken(params.token);
  if (!sig) notFound();
  const html = renderSignature(sig.data, { baseUrl: getBaseUrl() });
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-brand">{APP_NAME}</div>
        <h1 className="text-2xl font-semibold">Your email signature is ready</h1>
        <p className="text-sm text-stone-500">
          {oauthConfigured() ? "Install it in Gmail with one click, or copy it below for other email apps." : "Copy it below and follow the steps for your email app."}
        </p>
      </div>
      <GmailResult status={searchParams.gmail} msg={searchParams.msg} />
      {oauthConfigured() && searchParams.gmail !== "ok" && (
        <div className="mb-6">
          <GmailConnectButton token={sig.publicToken} />
        </div>
      )}
      <InstallView html={html} fileName={`${sig.name.replace(/[^\w-]+/g, "_")}.html`} downloadUrl={`/api/public/signatures/${sig.publicToken}/html`} />
    </main>
  );
}
