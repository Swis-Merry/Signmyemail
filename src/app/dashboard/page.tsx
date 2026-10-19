import Link from "next/link";
import AppShell from "@/components/AppShell";
import { listGenerators } from "@/lib/generators";
import { listSignatures } from "@/lib/signatures";
import SignatureTable from "./SignatureTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() || "";
  const [sigs, gens] = await Promise.all([listSignatures(q || undefined), listGenerators()]);
  return (
    <AppShell>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Signatures" value={sigs.length} />
        <Stat label="Generators" value={gens.length} />
        <Stat label="Synced to Gmail" value={sigs.filter((s) => s.gmailSyncedAt).length} />
      </div>

      <section className="card mb-8 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Generators</h2>
            <p className="text-sm text-stone-500">Share a link so employees can fill in their own details with locked company branding.</p>
          </div>
          <Link href="/generators/new" className="btn-secondary">New generator</Link>
        </div>
        {gens.length === 0 ? (
          <p className="text-sm text-stone-400">No generators yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {gens.map((g) => (
              <li key={g.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium">{g.name}</span>
                  {!g.isActive && <span className="ml-2 rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-500">inactive</span>}
                  <span className="ml-3 text-stone-400">/g/{g.slug}</span>
                </div>
                <div className="flex gap-3">
                  <a href={`/g/${g.slug}`} target="_blank" className="text-brand hover:underline">Open</a>
                  <Link href={`/generators/${g.id}`} className="text-brand hover:underline">Edit</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Signatures</h2>
          <div className="flex gap-2">
            <form className="flex gap-2">
              <input name="q" defaultValue={q} placeholder="Search name or email" className="input w-64" />
              <button className="btn-secondary">Search</button>
            </form>
            <Link href="/signatures/new" className="btn-primary">Create signature</Link>
          </div>
        </div>
        <SignatureTable rows={sigs.map((s) => ({ id: s.id, name: s.name, email: s.email, synced: !!s.gmailSyncedAt, fromGenerator: !!s.generatorId }))} />
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
