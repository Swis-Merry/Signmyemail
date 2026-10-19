"use client";

import { useRef, useState } from "react";

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean }) {
  return (
    <input
      className="input disabled:bg-stone-100 disabled:text-stone-500"
      type={props.type ?? "text"}
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-stone-300 bg-white p-1" />
      <input className="input font-mono" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Segmented<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`rounded-md border px-3 py-1.5 text-sm ${value === o.value ? "border-brand bg-brand text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ImageUpload({ value, onChange, uploadUrl = "/api/upload", disabled }: { value: string; onChange: (v: string) => void; uploadUrl?: string; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(uploadUrl, { method: "POST", body: fd });
    setBusy(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setError(json.error || "Upload failed");
    onChange(json.url);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-14 w-14 rounded border border-stone-200 object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded border border-dashed border-stone-300 text-xs text-stone-400">None</div>
        )}
        <button type="button" disabled={busy || disabled} className="btn-secondary" onClick={() => ref.current?.click()}>
          {busy ? "Uploading..." : "Upload image"}
        </button>
        {value && !disabled && (
          <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => onChange("")}>Remove</button>
        )}
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      {!disabled && <TextInput value={value} onChange={onChange} placeholder="...or paste an image URL" />}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
