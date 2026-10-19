import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import GmailPushButton from "@/components/GmailPushButton";
import InstallView from "@/components/InstallView";
import { gmailConfigured } from "@/lib/google";
import { renderSignature } from "@/lib/signature/render";
import { getSignature } from "@/lib/signatures";
import { getBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function SignaturePage({ params }: { params: { id: string } }) {
  const sig = await getSignature(params.id);
  if (!sig) notFound();
  const html = renderSignature(sig.data, { baseUrl: getBaseUrl() });
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{sig.name}</h1>
          <p className="text-sm text-stone-500">{sig.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/s/${sig.publicToken}`} target="_blank" className="btn-secondary">Shareable install link</Link>
          <Link href={`/signatures/${sig.id}/edit`} className="btn-secondary">Edit</Link>
        </div>
      </div>
      <InstallView
        html={html}
        fileName={`${sig.name.replace(/[^\w-]+/g, "_")}.html`}
        downloadUrl={`/api/public/signatures/${sig.publicToken}/html`}
        extra={<GmailPushButton id={sig.id} email={sig.email} configured={gmailConfigured()} syncedAt={sig.gmailSyncedAt?.toISOString() ?? null} />}
      />
    </AppShell>
  );
}
