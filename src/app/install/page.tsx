import { redirect } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { workspaceDomain } from "@/lib/google";
import { getSignatureByEmail } from "@/lib/signatures";

export const dynamic = "force-dynamic";

/** Staff self-serve: type your work email, get sent to your own signature install page. */
export default async function InstallPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = (searchParams.email || "").trim().toLowerCase();
  const domain = workspaceDomain();
  let error = "";
  if (email) {
    if (domain && !email.endsWith("@" + domain)) {
      error = `Please use your @${domain} email address.`;
    } else {
      const sig = await getSignatureByEmail(email);
      if (sig) redirect(`/s/${sig.publicToken}`);
      error = `We couldn't find a signature for ${email}.`;
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="text-sm font-semibold uppercase tracking-wide text-brand">{APP_NAME}</div>
      <h1 className="mb-2 text-2xl font-semibold">Get your email signature</h1>
      <p className="mb-6 text-sm text-stone-600">
        Enter your work email address. You&apos;ll get your signature with a Copy button and short steps for Outlook.
      </p>
      <form method="get" className="card space-y-3 p-6">
        <label htmlFor="email" className="label">Work email</label>
        <input id="email" name="email" type="email" required defaultValue={email} placeholder={`name@${domain || "company.com"}`} className="input" autoFocus />
        {error && (
          <p className="text-sm text-red-600">
            {error} Please ask the Marketing team to set it up for you.
          </p>
        )}
        <button type="submit" className="btn-primary">Show my signature</button>
      </form>
    </main>
  );
}
