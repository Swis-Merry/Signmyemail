import { notFound } from "next/navigation";
import { APP_NAME } from "@/lib/config";
import { EDITABLE_FIELD_OPTIONS, getGeneratorBySlug } from "@/lib/generators";
import GeneratorForm from "./GeneratorForm";

export const dynamic = "force-dynamic";

export default async function PublicGeneratorPage({ params }: { params: { slug: string } }) {
  const gen = await getGeneratorBySlug(params.slug);
  if (!gen || !gen.isActive) notFound();
  const fields = EDITABLE_FIELD_OPTIONS.filter((f) => gen.editableFields.includes(f.id));
  const data = structuredClone(gen.data);
  for (const f of gen.editableFields) {
    if (f === "socials") data.socials = data.socials.map((s) => ({ ...s, url: "" }));
    else if (f in data.details && f !== "customFields") (data.details as unknown as Record<string, string>)[f] = "";
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-brand">{APP_NAME}</div>
        <h1 className="text-2xl font-semibold">{gen.name}</h1>
        <p className="text-sm text-stone-500">Fill in your details to create your email signature.</p>
      </div>
      <GeneratorForm slug={gen.slug} initial={data} fields={fields.map((f) => ({ id: f.id, label: f.label }))} />
    </main>
  );
}
