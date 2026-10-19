import AppShell from "@/components/AppShell";
import GeneratorEditor from "@/components/editor/GeneratorEditor";
import { DEFAULT_EDITABLE, EDITABLE_FIELD_OPTIONS } from "@/lib/generators";
import { defaultSignatureData, SAMPLE_DETAILS } from "@/lib/signature/defaults";

export default function NewGeneratorPage() {
  const data = defaultSignatureData();
  data.details = { ...SAMPLE_DETAILS, customFields: [] };
  return (
    <AppShell wide>
      <GeneratorEditor initial={{ name: "Team signatures", slug: "", data, editableFields: DEFAULT_EDITABLE, isActive: true }} fieldOptions={EDITABLE_FIELD_OPTIONS} />
    </AppShell>
  );
}
