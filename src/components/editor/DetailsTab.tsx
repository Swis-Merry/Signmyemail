"use client";

import { newId } from "@/lib/signature/defaults";
import type { CustomField, Details, FieldType } from "@/lib/signature/types";
import type { TabProps } from "./shared";
import { Field, ImageUpload, Select, TextInput } from "./ui";

type TextKey = Exclude<keyof Details, "customFields" | "avatarUrl">;

const FIELDS: { key: TextKey; label: string; placeholder: string; wide?: boolean }[] = [
  { key: "name", label: "Full name", placeholder: "Jane Smith" },
  { key: "jobTitle", label: "Job title", placeholder: "Property Consultant" },
  { key: "company", label: "Company", placeholder: "DRE Homes" },
  { key: "email", label: "Email", placeholder: "jane@drehomes.com" },
  { key: "phone", label: "Phone", placeholder: "+971 4 000 0000" },
  { key: "mobile", label: "Mobile", placeholder: "+971 50 000 0000" },
  { key: "website", label: "Website", placeholder: "www.drehomes.com" },
  { key: "fax", label: "Fax", placeholder: "" },
  { key: "address", label: "Address", placeholder: "Office address", wide: true },
];

const TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "url", label: "Link" },
];

export default function DetailsTab({ data, update }: TabProps) {
  const d = data.details;
  const set = (patch: Partial<Details>) => update((s) => ({ ...s, details: { ...s.details, ...patch } }));
  const setCustom = (id: string, patch: Partial<CustomField>) =>
    set({ customFields: d.customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label} className={f.wide ? "sm:col-span-2" : ""}>
            <TextInput value={d[f.key]} placeholder={f.placeholder} onChange={(v) => set({ [f.key]: v } as Partial<Details>)} />
          </Field>
        ))}
      </div>
      <Field label="Photo or logo">
        <ImageUpload value={d.avatarUrl} onChange={(v) => set({ avatarUrl: v })} />
      </Field>
      <div>
        <div className="label">Custom fields</div>
        <div className="space-y-2">
          {d.customFields.map((f) => (
            <div key={f.id} className="grid grid-cols-[1fr_2fr_auto_auto] gap-2">
              <TextInput value={f.label} placeholder="Label (e.g. BRN)" onChange={(v) => setCustom(f.id, { label: v })} />
              <TextInput value={f.value} placeholder="Value" onChange={(v) => setCustom(f.id, { value: v })} />
              <Select value={f.type} options={TYPES} onChange={(v) => setCustom(f.id, { type: v })} />
              <button type="button" className="px-2 text-red-600" title="Remove" onClick={() => set({ customFields: d.customFields.filter((x) => x.id !== f.id) })}>
                &times;
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-secondary mt-2"
          onClick={() => set({ customFields: [...d.customFields, { id: newId(), label: "", value: "", type: "text" }] })}
        >
          + Add field
        </button>
      </div>
    </div>
  );
}
