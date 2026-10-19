"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { SignatureData } from "@/lib/signature/types";
import AddonsTab from "./AddonsTab";
import DesignTab from "./DesignTab";
import DetailsTab from "./DetailsTab";
import Preview from "./Preview";
import type { Update } from "./shared";
import SocialTab from "./SocialTab";

export const TABS = [
  { id: "details", label: "Details", Comp: DetailsTab },
  { id: "social", label: "Social", Comp: SocialTab },
  { id: "design", label: "Design", Comp: DesignTab },
  { id: "addons", label: "Add-ons", Comp: AddonsTab },
] as const;

export function useEditorState(initial: SignatureData) {
  const [data, setData] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const update: Update = useCallback((fn) => {
    setData((d) => fn(d));
    setDirty(true);
  }, []);
  return { data, update, dirty, setDirty };
}

export function EditorLayout({ data, update, sidebarExtra, header, extraTab }: {
  data: SignatureData;
  update: Update;
  header: React.ReactNode;
  sidebarExtra?: React.ReactNode;
  extraTab?: { id: string; label: string; node: React.ReactNode };
}) {
  const tabs = [...(extraTab ? [{ id: extraTab.id, label: extraTab.label }] : []), ...TABS.map((t) => ({ id: t.id, label: t.label }))];
  const [tab, setTab] = useState<string>(tabs[0].id);
  const active = TABS.find((t) => t.id === tab);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {header}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="card flex min-h-[600px] overflow-hidden">
          <nav className="w-32 shrink-0 border-r border-stone-200 bg-stone-50 py-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`block w-full px-4 py-3 text-left text-sm font-medium ${tab === t.id ? "border-l-4 border-brand bg-white text-brand-dark" : "border-l-4 border-transparent text-stone-600 hover:bg-white"}`}
              >
                {t.label}
              </button>
            ))}
            {sidebarExtra}
          </nav>
          <div className="min-w-0 flex-1 p-6">
            {extraTab && tab === extraTab.id ? extraTab.node : active ? <active.Comp data={data} update={update} /> : null}
          </div>
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Preview data={data} />
        </div>
      </div>
    </div>
  );
}

export default function SignatureEditor({ initial, id, others = [] }: { initial: SignatureData; id?: string; others?: { id: string; name: string }[] }) {
  const router = useRouter();
  const { data, update, dirty, setDirty } = useEditorState(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function save(then: "install" | "stay" | "generator") {
    setSaving(then);
    setError("");
    const res = then === "generator"
      ? await fetch("/api/generators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `${data.details.company || "Company"} generator`, data }) })
      : await fetch(id ? `/api/signatures/${id}` : "/api/signatures", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
    const json = await res.json().catch(() => ({}));
    setSaving(null);
    if (!res.ok) return setError(json.error || "Save failed");
    if (then === "generator") return router.push(`/generators/${json.id}`);
    setDirty(false);
    if (then === "install") router.push(`/signatures/${json.id}`);
    else if (!id) router.replace(`/signatures/${json.id}/edit`);
    router.refresh();
  }

  const header = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{id ? "Edit signature" : "New signature"}</h1>
        {others.length > 0 && (
          <select className="input w-56" value={id} onChange={(e) => router.push(`/signatures/${e.target.value}/edit`)}>
            {others.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        )}
        {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
      </div>
      <div className="flex items-center gap-2">
        {error && <span className="text-sm text-red-600">{error}</span>}
        <button className="btn-secondary" disabled={!!saving} onClick={() => save("generator")}>{saving === "generator" ? "Creating..." : "Save as generator"}</button>
        <button className="btn-secondary" disabled={!!saving} onClick={() => save("stay")}>{saving === "stay" ? "Saving..." : "Save"}</button>
        <button className="btn-primary" disabled={!!saving} onClick={() => save("install")}>{saving === "install" ? "Saving..." : "Save & install"}</button>
      </div>
    </div>
  );

  return <EditorLayout data={data} update={update} header={header} />;
}
