import Link from "next/link";
import AppShell from "@/components/AppShell";
import { listSignatures } from "@/lib/signatures";
import SignatureTable from "./SignatureTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() || "";
  const sigs = await listSignatures(q || undefined);
  return (
    <AppShell>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Signatures" value={sigs.length} />
        <Stat label="Missing photo" value={sigs.filter((s) => !s.hasPhoto).length} />
        <Stat label="Missing job title" value={sigs.filter((s) => !s.hasTitle).length} />
      </div>

      <section className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Signatures</h2>
          <div className="flex gap-2">
            <form className="flex gap-2">
              <input name="q" defaultValue={q} placeholder="Search name or email" className="input w-64" />
              <button className="btn-secondary">Search</button>
            </form>
            <Link href="/bulk" className="btn-secondary">Bulk upload</Link>
            <Link href="/signatures/new" className="btn-primary">Create signature</Link>
          </div>
        </div>
        <SignatureTable rows={sigs.map((s) => ({ id: s.id, name: s.name, email: s.email, synced: !!s.gmailSyncedAt, hasPhoto: s.hasPhoto, hasTitle: s.hasTitle }))} />
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-stone-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-brand-dark">{value}</div>
    </div>
  );
}
