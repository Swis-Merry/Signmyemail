"use client";

import { FONT_FAMILIES } from "@/lib/signature/defaults";
import { TEMPLATE_OPTIONS } from "@/lib/signature/render";
import type { Design } from "@/lib/signature/types";
import type { TabProps } from "./shared";
import { ColorInput, Field, Segmented, Select } from "./ui";

export default function DesignTab({ data, update }: TabProps) {
  const x = data.design;
  const set = (patch: Partial<Design>) => update((s) => ({ ...s, design: { ...s.design, ...patch } }));

  return (
    <div className="space-y-6">
      <Field label="Template">
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATE_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => set({ templateId: t.id })}
              className={`rounded-md border px-3 py-2 text-left text-sm ${x.templateId === t.id ? "border-brand bg-brand-light font-medium text-brand-dark" : "border-stone-300 bg-white hover:bg-stone-50"}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Primary color"><ColorInput value={x.primaryColor} onChange={(v) => set({ primaryColor: v })} /></Field>
        <Field label="Secondary color"><ColorInput value={x.secondaryColor} onChange={(v) => set({ secondaryColor: v })} /></Field>
        <Field label="Text color"><ColorInput value={x.textColor} onChange={(v) => set({ textColor: v })} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Font"><Select value={x.fontFamily} onChange={(v) => set({ fontFamily: v })} options={FONT_FAMILIES} /></Field>
        <Field label="Font size">
          <Segmented value={x.fontSize} onChange={(v) => set({ fontSize: v })} options={[{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }, { value: "xl", label: "XL" }]} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Photo size (${x.avatarSize}px)`}>
          <input type="range" min={48} max={160} step={4} value={x.avatarSize} onChange={(e) => set({ avatarSize: Number(e.target.value) })} className="w-full accent-brand" />
        </Field>
        <Field label="Photo shape">
          <Segmented value={x.avatarShape} onChange={(v) => set({ avatarShape: v })} options={[{ value: "square", label: "Square" }, { value: "rounded", label: "Rounded" }, { value: "circle", label: "Circle" }]} />
        </Field>
      </div>
      <Field label="Title / company separator">
        <Segmented value={x.titleSeparator} onChange={(v) => set({ titleSeparator: v })} options={[{ value: "|", label: "|" }, { value: "/", label: "/" }, { value: "at", label: "at" }, { value: "newline", label: "New line" }]} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Social icon style">
          <Segmented value={x.iconStyle} onChange={(v) => set({ iconStyle: v })} options={[{ value: "custom", label: "Custom color" }, { value: "brand", label: "Brand colors" }, { value: "text", label: "Text links" }]} />
        </Field>
        <Field label="Icon shape">
          <Segmented value={x.iconShape} onChange={(v) => set({ iconShape: v })} options={[{ value: "circle", label: "Circle" }, { value: "rounded", label: "Rounded" }, { value: "square", label: "Square" }, { value: "none", label: "None" }]} />
        </Field>
      </div>
      {x.iconStyle !== "brand" && (
        <Field label="Icon color"><ColorInput value={x.iconColor} onChange={(v) => set({ iconColor: v })} /></Field>
      )}
      <Field label={`Max width (${x.width}px)`}>
        <input type="range" min={400} max={700} step={10} value={x.width} onChange={(e) => set({ width: Number(e.target.value) })} className="w-full accent-brand" />
      </Field>
    </div>
  );
}
