import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import SignatureEditor from "@/components/editor/SignatureEditor";
import { getSignature, listSignatures } from "@/lib/signatures";

export const dynamic = "force-dynamic";

export default async function EditSignaturePage({ params }: { params: { id: string } }) {
  const [sig, all] = await Promise.all([getSignature(params.id), listSignatures()]);
  if (!sig) notFound();
  return (
    <AppShell wide>
      <SignatureEditor key={sig.id} id={sig.id} initial={sig.data} others={all.map((s) => ({ id: s.id, name: s.name }))} />
    </AppShell>
  );
}
