"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SignatureData } from "@/lib/signature/types";
import { EditorLayout, useEditorState } from "./SignatureEditor";
import { Field, TextInput } from "./ui";

export interface GeneratorInitial {
  id?: string;
  name: string;
  slug: string;
  data: SignatureData;
  editableFields: string[];
  isActive: boolean;
}

export default function GeneratorEditor({ initial, fieldOptions }: { initial: GeneratorInitial; fieldOptions: readonly { id: string; label: string }[] }) {
  const router = useRouter();
  const { data, update, dirty, setDirty } = useEditorState(initial.data);
  const [meta, setMeta] = useState({ name: initial.name, slug: initial.slug, editableFields: initial.editableFields, isActive: initial.isActive });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");
  if (typeof window !== "undefined" && !origin) setOrigin(window.location.origin);

  const setM = (p: Partial<typeof meta>) => {
    setMeta((m) => ({ ...m, ...p }));
    setDirty(true);
  };

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch(initial.id ? `/api/generators/${initial.id}` : "/api/generators", {
      method: initial.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...meta, data }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(json.error || "Save failed");
    setDirty(false);
    if (json.slug) setMeta((m) => ({ ...m, slug: json.slug }));
    if (!initial.id) router.replace(`/generators/${json.id}`);
    router.refresh();
  }

  async function remove() {
    if (!initial.id || !confirm("Delete this generator? Signatures created from it are kept.")) return;
    await fetch(`/api/generators/${initial.id}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  const link = initial.id && meta.slug ? `${origin}/g/${meta.slug}` : "";

  const settings = (
    <div className="space-y-5">
      <Field label="Generator name"><TextInput value={meta.name} onChange={(v) => setM({ name: v })} /></Field>
      <Field label="Link slug"><TextInput value={meta.slug} onChange={(v) => setM({ slug: v })} placeholder="dre-team" /></Field>
      {link && (
        <div className="rounded-md bg-brand-light p-3 text-sm">
          <div className="label">Shareable link</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate">{link}</code>
            <button type="button" className="btn-secondary" onClick={() => navigator.clipboard.writeText(link)}>Copy</button>
          </div>
        </div>
      )}
      <div>
        <div className="label">Fields employees can edit</div>
        <p className="mb-2 text-xs text-stone-500">Everything else (design, company details, banner, add-ons) is locked to what you set in the other tabs.</p>
        <div className="grid grid-cols-2 gap-1">
          {fieldOptions.map((f) => (
            <label key={f.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-brand"
                checked={meta.editableFields.includes(f.id)}
                onChange={(e) => setM({ editableFields: e.target.checked ? [...meta.editableFields, f.id] : meta.editableFields.filter((x) => x !== f.id) })}
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="accent-brand" checked={meta.isActive} onChange={(e) => setM({ isActive: e.target.checked })} />
        Active (link accepts new submissions)
      </label>
    </div>
  );

  const header = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{initial.id ? "Edit generator" : "New generator"}</h1>
        {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
      </div>
      <div className="flex items-center gap-2">
        {error && <span className="text-sm text-red-600">{error}</span>}
        {initial.id && <button className="btn-danger" onClick={remove}>Delete</button>}
        {link && <a className="btn-secondary" href={link} target="_blank">Open form</a>}
        <button className="btn-primary" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save generator"}</button>
      </div>
    </div>
  );

  return <EditorLayout data={data} update={update} header={header} extraTab={{ id: "settings", label: "Generator", node: settings }} />;
}
