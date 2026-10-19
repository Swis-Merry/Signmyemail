"use client";

import { ADDON_LABELS, newAddon } from "@/lib/signature/defaults";
import type { Addon, AddonType } from "@/lib/signature/types";
import type { TabProps } from "./shared";
import { Field, ImageUpload, TextInput } from "./ui";

export default function AddonsTab({ data, update }: TabProps) {
  const addons = data.addons;
  const setAddons = (next: Addon[]) => update((s) => ({ ...s, addons: next }));
  const patch = (id: string, p: Partial<Addon>) => setAddons(addons.map((a) => (a.id === id ? ({ ...a, ...p } as Addon) : a)));
  const used = new Set(addons.map((a) => a.type));

  return (
    <div className="space-y-4">
      {addons.map((a) => (
        <div key={a.id} className="rounded-lg border border-stone-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium">{ADDON_LABELS[a.type]}</span>
            <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setAddons(addons.filter((x) => x.id !== a.id))}>Remove</button>
          </div>
          <AddonFields addon={a} patch={(p) => patch(a.id, p)} />
        </div>
      ))}
      <div>
        <div className="label">Add an add-on</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ADDON_LABELS) as AddonType[])
            .filter((t) => !used.has(t))
            .map((t) => (
              <button key={t} type="button" className="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm hover:border-brand hover:text-brand" onClick={() => setAddons([...addons, newAddon(t)])}>
                + {ADDON_LABELS[t]}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

function AddonFields({ addon: a, patch }: { addon: Addon; patch: (p: Partial<Addon>) => void }) {
  switch (a.type) {
    case "banner":
      return (
        <div className="space-y-3">
          <Field label="Banner image"><ImageUpload value={a.imageUrl} onChange={(v) => patch({ imageUrl: v })} /></Field>
          <Field label="Link (optional)"><TextInput value={a.link} onChange={(v) => patch({ link: v })} placeholder="https://www.drehomes.com" /></Field>
          <Field label={`Width (${a.width}px)`}>
            <input type="range" min={200} max={700} step={10} value={a.width} onChange={(e) => patch({ width: Number(e.target.value) })} className="w-full accent-brand" />
          </Field>
        </div>
      );
    case "disclaimer":
      return <textarea className="input min-h-24" value={a.text} onChange={(e) => patch({ text: e.target.value })} placeholder="This email and any attachments are confidential..." />;
    case "quote":
      return (
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <TextInput value={a.text} onChange={(v) => patch({ text: v })} placeholder="Quote" />
          <TextInput value={a.author} onChange={(v) => patch({ author: v })} placeholder="Author" />
        </div>
      );
    case "meeting":
      return (
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <TextInput value={a.label} onChange={(v) => patch({ label: v })} placeholder="Button text" />
          <TextInput value={a.url} onChange={(v) => patch({ url: v })} placeholder="https://calendly.com/..." />
        </div>
      );
    case "mobileapp":
      return (
        <div className="space-y-3">
          <Field label="App Store URL"><TextInput value={a.appStoreUrl} onChange={(v) => patch({ appStoreUrl: v })} /></Field>
          <Field label="Google Play URL"><TextInput value={a.googlePlayUrl} onChange={(v) => patch({ googlePlayUrl: v })} /></Field>
        </div>
      );
    case "links":
      return (
        <div className="space-y-2">
          {a.items.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
              <TextInput value={l.label} onChange={(v) => patch({ items: a.items.map((x, j) => (j === i ? { ...x, label: v } : x)) })} placeholder="Label" />
              <TextInput value={l.url} onChange={(v) => patch({ items: a.items.map((x, j) => (j === i ? { ...x, url: v } : x)) })} placeholder="https://" />
              <button type="button" className="px-2 text-red-600" onClick={() => patch({ items: a.items.filter((_, j) => j !== i) })}>&times;</button>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={() => patch({ items: [...a.items, { label: "", url: "" }] })}>+ Add link</button>
        </div>
      );
    case "badges":
      return (
        <div className="space-y-3">
          {a.items.map((b, i) => (
            <div key={i} className="rounded border border-stone-100 p-3">
              <ImageUpload value={b.imageUrl} onChange={(v) => patch({ items: a.items.map((x, j) => (j === i ? { ...x, imageUrl: v } : x)) })} />
              <div className="mt-2 flex gap-2">
                <div className="flex-1"><TextInput value={b.link} onChange={(v) => patch({ items: a.items.map((x, j) => (j === i ? { ...x, link: v } : x)) })} placeholder="Link (optional)" /></div>
                <button type="button" className="px-2 text-red-600" onClick={() => patch({ items: a.items.filter((_, j) => j !== i) })}>&times;</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={() => patch({ items: [...a.items, { imageUrl: "", link: "" }] })}>+ Add badge</button>
          <Field label={`Badge height (${a.height}px)`}>
            <input type="range" min={24} max={100} step={2} value={a.height} onChange={(e) => patch({ height: Number(e.target.value) })} className="w-full accent-brand" />
          </Field>
        </div>
      );
  }
}
