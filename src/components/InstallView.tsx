"use client";

import { useState } from "react";

const CLIENTS: Record<string, { label: string; steps: string[] }> = {
  gmail: {
    label: "Gmail",
    steps: [
      "Click \"Copy signature\" above.",
      "In Gmail, open Settings (gear icon) > See all settings.",
      "On the General tab, scroll to Signature and click \"Create new\".",
      "Paste into the signature box (Ctrl+V / Cmd+V).",
      "Set it as the default for new emails and replies, then click Save Changes at the bottom.",
    ],
  },
  outlook: {
    label: "Outlook",
    steps: [
      "Click \"Copy signature\" above.",
      "Outlook on the web: Settings > Mail > Compose and reply. Outlook desktop: File > Options > Mail > Signatures.",
      "Create a new signature and paste into the editor.",
      "Choose it as the default for new messages and replies, then Save.",
    ],
  },
  apple: {
    label: "Apple Mail",
    steps: [
      "Click \"Copy signature\" above (use Safari for best results).",
      "In Mail, open Settings > Signatures and click + to add a signature.",
      "Untick \"Always match my default message font\".",
      "Paste into the signature preview on the right and close the window.",
    ],
  },
  mobile: {
    label: "iPhone / Android",
    steps: [
      "Open this page on your phone (or email the link to yourself).",
      "Tap \"Copy signature\".",
      "iPhone: Settings > Mail > Signature, paste, then shake the phone and choose Undo to restore formatting if needed.",
      "Gmail app: signatures set in Gmail on the web are used automatically on mobile.",
    ],
  },
};

export default function InstallView({ html, fileName, downloadUrl, extra }: { html: string; fileName: string; downloadUrl: string; extra?: React.ReactNode }) {
  const [client, setClient] = useState("gmail");
  const [msg, setMsg] = useState("");

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  }

  async function copyRich() {
    try {
      const item = new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([html], { type: "text/plain" }) });
      await navigator.clipboard.write([item]);
    } catch {
      const el = document.getElementById("sig-preview");
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      document.execCommand("copy");
      sel?.removeAllRanges();
    }
    flash("Signature copied. Paste it into your email client.");
  }

  async function copySource() {
    await navigator.clipboard.writeText(html);
    flash("HTML source copied.");
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div id="sig-preview" className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={copyRich}>Copy signature</button>
        <button className="btn-secondary" onClick={copySource}>Copy HTML source</button>
        <a className="btn-secondary" href={downloadUrl} download={fileName}>Download .html</a>
        {extra}
        {msg && <span className="text-sm text-green-700">{msg}</span>}
      </div>
      <div className="card p-6">
        <h2 className="mb-3 font-semibold">How to install</h2>
        <div className="mb-4 flex flex-wrap gap-1">
          {Object.entries(CLIENTS).map(([k, c]) => (
            <button key={k} onClick={() => setClient(k)} className={`rounded-md px-3 py-1.5 text-sm ${client === k ? "bg-brand text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-700">
          {CLIENTS[client].steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
