import AppShell from "@/components/AppShell";
import SignatureEditor from "@/components/editor/SignatureEditor";
import { defaultSignatureData, SAMPLE_DETAILS } from "@/lib/signature/defaults";

export default function NewSignaturePage() {
  const data = defaultSignatureData();
  data.details = { ...SAMPLE_DETAILS, customFields: [] };
  return (
    <AppShell wide>
      <SignatureEditor initial={data} />
    </AppShell>
  );
}
