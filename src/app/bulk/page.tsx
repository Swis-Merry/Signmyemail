import AppShell from "@/components/AppShell";
import { requireAdmin } from "@/lib/auth";
import { listSignatures } from "@/lib/signatures";
import BulkTools from "./BulkTools";

export const dynamic = "force-dynamic";

export default async function BulkPage() {
  await requireAdmin();
  const sigs = await listSignatures();
  const complete = sigs.filter((s) => s.hasPhoto && s.hasTitle);
  return (
    <AppShell>
      <h1 className="mb-1 text-xl font-semibold">Bulk upload</h1>
      <p className="mb-6 text-sm text-stone-500">
        {sigs.length} signatures &middot; {sigs.filter((s) => !s.hasPhoto).length} missing a photo &middot; {sigs.filter((s) => !s.hasTitle).length} missing a job title
      </p>
      <BulkTools signatures={sigs.map((s) => ({ id: s.id, name: s.name, email: s.email }))} defaultSourceId={complete[0]?.id ?? sigs[0]?.id ?? ""} />
    </AppShell>
  );
}
