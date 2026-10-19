"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Preview from "@/components/editor/Preview";
import { Field, ImageUpload, TextInput } from "@/components/editor/ui";
import { SOCIAL_NETWORKS } from "@/lib/signature/socials";
import type { Details, SignatureData } from "@/lib/signature/types";

type TextKey = Exclude<keyof Details, "customFields">;

export default function GeneratorForm({ slug, initial, fields }: { slug: string; initial: SignatureData; fields: { id: string; label: string }[] }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setDetail = (k: TextKey, v: string) => setData((d) => ({ ...d, details: { ...d.details, [k]: v } }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/public/generators/${slug}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.error || "Something went wrong");
    router.push(`/s/${json.token}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={submit} className="card space-y-4 p-6">
        {fields.map((f) => {
          if (f.id === "socials") {
            return data.socials.length ? (
              <div key="socials" className="space-y-2">
                <div className="label">Social profiles</div>
                {data.socials.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="w-24 text-sm">{SOCIAL_NETWORKS[s.network]?.label ?? s.network}</span>
                    <div className="flex-1">
                      <TextInput value={s.url} placeholder={SOCIAL_NETWORKS[s.network]?.placeholder} onChange={(v) => setData((d) => ({ ...d, socials: d.socials.map((x) => (x.id === s.id ? { ...x, url: v } : x)) }))} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null;
          }
          if (f.id === "avatarUrl") {
            return (
              <Field key={f.id} label={f.label}>
                <ImageUpload value={data.details.avatarUrl} onChange={(v) => setDetail("avatarUrl", v)} uploadUrl={`/api/public/generators/${slug}/upload`} />
              </Field>
            );
          }
          return (
            <Field key={f.id} label={f.label}>
              <TextInput value={data.details[f.id as TextKey]} onChange={(v) => setDetail(f.id as TextKey, v)} />
            </Field>
          );
        })}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating..." : "Create my signature"}</button>
      </form>
      <div className="lg:sticky lg:top-6 lg:self-start">
        <Preview data={data} />
      </div>
    </div>
  );
}
