"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Row {
  id: string;
  name: string;
  email: string;
  synced: boolean;
  hasPhoto: boolean;
  hasTitle: boolean;
  publicToken: string;
}

export default function SignatureTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const installUrl = (r: Row) => `${window.location.origin}/s/${r.publicToken}`;

  async function share(r: Row) {
    await navigator.clipboard.writeText(installUrl(r));
    setCopied(r.id);
    setTimeout(() => setCopied((c) => (c === r.id ? null : c)), 2000);
  }

  function emailUser(r: Row) {
    const first = r.name.trim().split(/\s+/)[0] || "there";
    const body = [
      `Hi ${first},`,
      "",
      "Your new DRE email signature is ready. Open this link to get it:",
      installUrl(r),
      "",
      "1. Click \"Copy signature\".",
      "2. In Outlook go to Settings > Account > Signatures (classic Outlook: File > Options > Mail > Signatures).",
      "3. Click \"+ New signature\", paste it in, set it as the default for new messages and replies, and save.",
      "",
      "The page also has steps for the Outlook phone app.",
      "",
      "Thanks,",
      "Marketing",
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent("Your DRE email signature")}&body=${encodeURIComponent(body)}`;
  }

  async function act(id: string, kind: "duplicate" | "delete") {
    if (kind === "delete" && !confirm("Delete this signature?")) return;
    setBusy(id);
    const res = await fetch(kind === "delete" ? `/api/signatures/${id}` : `/api/signatures/${id}/duplicate`, {
      method: kind === "delete" ? "DELETE" : "POST",
    });
    setBusy(null);
    if (!res.ok) return alert("Something went wrong.");
    router.refresh();
  }

  if (!rows.length) return <p className="py-8 text-center text-sm text-stone-400">No signatures found.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((r) => (
            <tr key={r.id} className={busy === r.id ? "opacity-50" : ""}>
              <td className="py-2 pr-4 font-medium">
                <Link href={`/signatures/${r.id}/edit`} className="hover:text-brand">{r.name}</Link>
              </td>
              <td className="py-2 pr-4 text-stone-600">{r.email}</td>
              <td className="py-2 pr-4">
                {r.synced && <span className="mr-1 rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">Gmail</span>}
                {!r.hasPhoto && <span className="mr-1 rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">No photo</span>}
                {!r.hasTitle && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">No title</span>}
              </td>
              <td className="space-x-3 whitespace-nowrap py-2 text-right">
                <Link href={`/signatures/${r.id}/edit`} className="text-brand hover:underline">Edit</Link>
                <Link href={`/signatures/${r.id}`} className="text-brand hover:underline">Install</Link>
                <button onClick={() => emailUser(r)} className="text-brand hover:underline">Email to user</button>
                <button onClick={() => share(r)} className="text-brand hover:underline">{copied === r.id ? "Link copied" : "Share install URL"}</button>
                <a href={`/api/public/signatures/${r.publicToken}/card`} download className="text-brand hover:underline">Business card</a>
                <button onClick={() => act(r.id, "duplicate")} className="text-brand hover:underline">Duplicate</button>
                <button onClick={() => act(r.id, "delete")} className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
