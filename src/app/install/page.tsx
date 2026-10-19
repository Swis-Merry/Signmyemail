import { GmailConnectButton, GmailResult } from "@/components/GmailConnect";
import { APP_NAME } from "@/lib/config";
import { oauthConfigured } from "@/lib/googleOAuth";

export const dynamic = "force-dynamic";

export default function InstallPage({ searchParams }: { searchParams: { gmail?: string; msg?: string } }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="text-sm font-semibold uppercase tracking-wide text-brand">{APP_NAME}</div>
      <h1 className="mb-2 text-2xl font-semibold">Install your email signature in Gmail</h1>
      <p className="mb-6 text-sm text-stone-600">
        Sign in with your work Google account and click <b>Allow</b>. We&apos;ll find the signature made for your email address and
        put it in your Gmail. It only takes a few seconds.
      </p>
      <GmailResult status={searchParams.gmail} msg={searchParams.msg} />
      {oauthConfigured() ? (
        <GmailConnectButton />
      ) : (
        <p className="text-sm text-stone-500">Automatic Gmail install is not set up yet. Ask Marketing for your signature link.</p>
      )}
      <p className="mt-6 text-xs text-stone-400">We only ask Google for permission to change your Gmail signature. We can&apos;t read your email.</p>
    </main>
  );
}
