"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GmailPushButton({ id, email, configured, syncedAt }: { id: string; email: string; configured: boolean; syncedAt: string | null }) {
  const router = useRouter();
  const [state, setState] = useState<{ busy?: boolean; msg?: string; err?: boolean }>({});
  if (!configured) {
    return <span className="text-xs text-stone-400" title="Add Google Workspace credentials in Settings">Gmail push not configured</span>;
  }
  async function push() {
    setState({ busy: true });
    const res = await fetch(`/api/signatures/${id}/gmail`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setState(res.ok ? { msg: `Installed in ${email}'s Gmail.` } : { msg: json.error || "Failed", err: true });
    if (res.ok) router.refresh();
  }
  return (
    <span className="flex items-center gap-2">
      <button className="btn-secondary" disabled={state.busy || !email} onClick={push}>{state.busy ? "Pushing..." : "Push to Gmail"}</button>
      {state.msg ? (
        <span className={`text-sm ${state.err ? "text-red-600" : "text-green-700"}`}>{state.msg}</span>
      ) : (
        syncedAt && <span className="text-xs text-stone-500">Last pushed {new Date(syncedAt).toLocaleString()}</span>
      )}
    </span>
  );
}
