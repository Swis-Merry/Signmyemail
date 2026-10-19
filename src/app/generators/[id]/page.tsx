import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import GeneratorEditor from "@/components/editor/GeneratorEditor";
import { EDITABLE_FIELD_OPTIONS, getGenerator } from "@/lib/generators";

export const dynamic = "force-dynamic";

export default async function EditGeneratorPage({ params }: { params: { id: string } }) {
  const gen = await getGenerator(params.id);
  if (!gen) notFound();
  return (
    <AppShell wide>
      <GeneratorEditor key={gen.id} initial={{ id: gen.id, name: gen.name, slug: gen.slug, data: gen.data, editableFields: gen.editableFields, isActive: gen.isActive }} fieldOptions={EDITABLE_FIELD_OPTIONS} />
    </AppShell>
  );
}
