"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface Sig {
  id: string;
  name: string;
  email: string;
}

/** Minimal CSV parser: commas or tabs, double-quoted cells. */
export function parseTable(text: string): string[][] {
  const delim = text.split("\n")[0].includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) endCell();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endCell();
      rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell || row.length) {
    endCell();
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function toDetailRows(text: string) {
  const [head, ...body] = parseTable(text);
  if (!head) return [];
  const h = head.map((c) => c.trim().toLowerCase());
  const col = (...names: string[]) => h.findIndex((c) => names.some((n) => c.includes(n)));
  const email = col("email");
  const title = col("title", "position", "designation");
  const brn = col("brn");
  const mobile = col("mobile", "phone", "cell");
  if (email < 0) return [];
  return body.map((r) => {
    const t = title >= 0 ? r[title]?.trim() || "" : "";
    const b = brn >= 0 ? r[brn]?.trim() || "" : "";
    return {
      email: r[email]?.trim() || "",
      jobTitle: b && t ? `${t} | BRN ${b}` : t,
      mobile: mobile >= 0 ? r[mobile]?.trim() || "" : "",
    };
  });
}

export default function BulkTools({ signatures, defaultSourceId }: { signatures: Sig[]; defaultSourceId: string }) {
  const router = useRouter();
  const [sourceId, setSourceId] = useState(defaultSourceId);
  const sourceRef = useRef<HTMLSelectElement>(null);
  const [themeMsg, setThemeMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [photoLog, setPhotoLog] = useState<{ file: string; ok: boolean; msg: string }[]>([]);
  const [detailsMsg, setDetailsMsg] = useState("");
  const [notFound, setNotFound] = useState<string[]>([]);

  async function applyTheme() {
    // Read the visible selection: the browser can restore it on Back without updating React state.
    const id = sourceRef.current?.value || sourceId;
    const src = signatures.find((s) => s.id === id);
    if (!src || !confirm(`Copy the design, banner, company details and social links from ${src.name} to all other signatures? Names, titles, mobiles and photos are kept.`)) return;
    setBusy("theme");
    setThemeMsg("");
    const res = await fetch("/api/admin/apply-theme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceId: id }) });
    const json = await res.json().catch(() => ({}));
    setBusy("");
    setThemeMsg(res.ok ? `Theme applied to ${json.updated} signatures.` : json.error || "Failed");
    router.refresh();
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;
    setBusy("photos");
    setPhotoLog([]);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/bulk-photo", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      const entry = { file: file.name, ok: res.ok, msg: res.ok ? `${json.name}` : json.error || "Failed" };
      setPhotoLog((log) => [...log, entry]);
    }
    setBusy("");
    router.refresh();
  }

  async function uploadDetails(file: File | undefined) {
    if (!file) return;
    const rows = toDetailRows(await file.text());
    if (!rows.length) return setDetailsMsg("Couldn't find an Email column. The first row must be headers.");
    setBusy("details");
    setDetailsMsg("");
    setNotFound([]);
    const res = await fetch("/api/admin/bulk-details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
    const json = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) return setDetailsMsg(json.error || "Failed");
    setDetailsMsg(`Updated ${json.updated} signatures.`);
    setNotFound(json.notFound || []);
    router.refresh();
  }

  const ok = photoLog.filter((p) => p.ok).length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-6">
        <h2 className="mb-1 font-semibold">Photos</h2>
        <p className="mb-3 text-sm text-stone-600">
          Select many photos at once. Name each file by email (<code>arshad@drehomes.com.jpg</code>), the part before @ (<code>arshad.jpg</code>), or full name (<code>Arshad Farooq.jpg</code>). Photos are cropped to a square.
        </p>
        <input type="file" accept="image/*" multiple disabled={!!busy} onChange={(e) => uploadPhotos(e.target.files)} className="text-sm" />
        {photoLog.length > 0 && (
          <div className="mt-3 text-sm">
            <p className="mb-1">{busy === "photos" ? "Uploading..." : "Done."} {ok} matched, {photoLog.length - ok} not matched.</p>
            <ul className="max-h-56 overflow-y-auto text-xs">
              {photoLog.map((p, i) => (
                <li key={i} className={p.ok ? "text-green-700" : "text-red-600"}>{p.file}: {p.msg}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-1 font-semibold">Job titles and mobiles</h2>
        <p className="mb-3 text-sm text-stone-600">
          Upload a CSV (save the Excel sheet as CSV) with headers. Columns: <b>Email</b> (required), <b>Job title</b>, <b>BRN</b>, <b>Mobile</b>. BRN is added after the title, and the mobile also sets the WhatsApp link. Empty cells are left unchanged.
        </p>
        <input type="file" accept=".csv,.txt,.tsv" disabled={!!busy} onChange={(e) => uploadDetails(e.target.files?.[0])} className="text-sm" />
        {detailsMsg && <p className="mt-3 text-sm">{detailsMsg}</p>}
        {notFound.length > 0 && <p className="mt-1 text-xs text-red-600">No signature for: {notFound.join(", ")}</p>}
      </section>

      <section className="card p-6 lg:col-span-2">
        <h2 className="mb-1 font-semibold">Same theme for everyone</h2>
        <p className="mb-3 text-sm text-stone-600">
          Copies the layout, colors, fonts, banner, address, phone lines, website and LinkedIn/Instagram from one signature to all others. Each person keeps their own name, email, title, mobile, WhatsApp and photo.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select ref={sourceRef} autoComplete="off" className="input w-72" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
            {signatures.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
          <button className="btn-primary" disabled={!!busy || !sourceId} onClick={applyTheme}>{busy === "theme" ? "Applying..." : "Apply to all signatures"}</button>
        </div>
        {themeMsg && <p className="mt-3 text-sm">{themeMsg}</p>}
      </section>
    </div>
  );
}
