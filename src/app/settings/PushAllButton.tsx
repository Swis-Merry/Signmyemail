"use client";

import { useState } from "react";

export default function PushAllButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number; failures: { email: string; error: string }[] } | null>(null);
  const [error, setError] = useState("");

  async function run() {
    if (!confirm("Push every signature to its owner's Gmail? This overwrites their current Gmail signature.")) return;
    setBusy(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/gmail/push-all", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.error || "Failed");
    setResult(json);
  }

  return (
    <div className="space-y-3">
      <button className="btn-primary" disabled={busy} onClick={run}>{busy ? "Pushing..." : "Push all signatures to Gmail"}</button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <div className="text-sm">
          <p className="text-green-700">{result.ok} installed{result.failed ? `, ${result.failed} failed` : ""}.</p>
          {result.failures.length > 0 && (
            <ul className="mt-2 max-h-48 overflow-y-auto text-xs text-red-600">
              {result.failures.map((f) => (
                <li key={f.email}>{f.email}: {f.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
