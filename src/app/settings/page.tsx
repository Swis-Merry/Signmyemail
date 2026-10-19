import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { gmailConfigured, workspaceDomain } from "@/lib/google";
import { oauthConfigured, redirectUri } from "@/lib/googleOAuth";
import { getBaseUrl } from "@/lib/url";
import PushAllButton from "./PushAllButton";
import PasswordForm from "./PasswordForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const configured = gmailConfigured();
  const selfServe = oauthConfigured();
  const base = getBaseUrl();
  return (
    <AppShell>
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-1 font-semibold">Account</h2>
          <p className="mb-4 text-sm text-stone-500">{user.name} &middot; {user.email}</p>
          <PasswordForm />
        </section>
        <section className="card p-6">
          <h2 className="mb-1 font-semibold">Google Workspace</h2>
          {configured ? (
            <>
              <p className="mb-4 text-sm text-green-700">Connected{workspaceDomain() ? ` to ${workspaceDomain()}` : ""}. You can push signatures straight into Gmail.</p>
              <PushAllButton />
            </>
          ) : (
            <div className="space-y-2 text-sm text-stone-600">
              <p>Not connected. To push signatures into everyone&apos;s Gmail:</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>In Google Cloud, create a service account and enable the Gmail API.</li>
                <li>In the Google Admin console, go to Security &gt; API controls &gt; Domain-wide delegation and authorize the service account&apos;s client ID with the scope <code className="rounded bg-stone-100 px-1">https://www.googleapis.com/auth/gmail.settings.basic</code>.</li>
                <li>Set <code className="rounded bg-stone-100 px-1">GOOGLE_SERVICE_ACCOUNT_JSON</code> (the key file contents) and <code className="rounded bg-stone-100 px-1">GOOGLE_WORKSPACE_DOMAIN</code> in the hosting environment.</li>
              </ol>
            </div>
          )}
        </section>
        <section className="card p-6 lg:col-span-2">
          <h2 className="mb-1 font-semibold">Gmail self-install (no Workspace admin needed)</h2>
          {selfServe ? (
            <div className="space-y-2 text-sm text-stone-600">
              <p className="text-green-700">Ready. Send staff this link. Each person signs in with Google, clicks Allow, and their signature is put in their Gmail:</p>
              <p><a href={`${base}/install`} target="_blank" className="font-medium text-brand underline">{base}/install</a></p>
              <p>Each signature&apos;s shareable install link also has an &quot;Install in Gmail automatically&quot; button.</p>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-stone-600">
              <p>Not set up. Signed in to Google with a @{workspaceDomain() || "your company"} account (any user, not an admin):</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>In Google Cloud console, create a project and enable the <b>Gmail API</b>.</li>
                <li>Under Google Auth Platform, set the audience to <b>Internal</b> and add the scope <code className="rounded bg-stone-100 px-1">https://www.googleapis.com/auth/gmail.settings.basic</code>.</li>
                <li>Create an OAuth client of type <b>Web application</b> with redirect URI <code className="rounded bg-stone-100 px-1">{redirectUri(base)}</code>.</li>
                <li>Set <code className="rounded bg-stone-100 px-1">GOOGLE_OAUTH_CLIENT_ID</code> and <code className="rounded bg-stone-100 px-1">GOOGLE_OAUTH_CLIENT_SECRET</code> in the hosting environment and redeploy.</li>
              </ol>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
