"use client";

import { newId } from "@/lib/signature/defaults";
import { SOCIAL_NETWORKS } from "@/lib/signature/socials";
import type { SocialLink } from "@/lib/signature/types";
import type { TabProps } from "./shared";
import { TextInput } from "./ui";

export default function SocialTab({ data, update }: TabProps) {
  const links = data.socials;
  const setLinks = (socials: SocialLink[]) => update((s) => ({ ...s, socials }));
  const used = new Set(links.map((l) => l.network));

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    setLinks(next);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {links.length === 0 && <p className="text-sm text-stone-400">No social profiles yet. Add one below.</p>}
        {links.map((l, i) => (
          <div key={l.id} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-sm font-medium">{SOCIAL_NETWORKS[l.network]?.label ?? l.network}</span>
            <div className="flex-1">
              <TextInput
                value={l.url}
                placeholder={SOCIAL_NETWORKS[l.network]?.placeholder}
                onChange={(v) => setLinks(links.map((x) => (x.id === l.id ? { ...x, url: v } : x)))}
              />
            </div>
            <button type="button" className="px-1 text-stone-500 hover:text-stone-800 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} title="Move up">&uarr;</button>
            <button type="button" className="px-1 text-stone-500 hover:text-stone-800 disabled:opacity-30" disabled={i === links.length - 1} onClick={() => move(i, 1)} title="Move down">&darr;</button>
            <button type="button" className="px-1 text-red-600" onClick={() => setLinks(links.filter((x) => x.id !== l.id))} title="Remove">&times;</button>
          </div>
        ))}
      </div>
      <div>
        <div className="label">Add a profile</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SOCIAL_NETWORKS)
            .filter(([key]) => !used.has(key))
            .map(([key, n]) => (
              <button
                key={key}
                type="button"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm hover:border-brand hover:text-brand"
                onClick={() => setLinks([...links, { id: newId(), network: key, url: "" }])}
              >
                + {n.label}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
