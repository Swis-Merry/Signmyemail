"use client";

import { useState } from "react";

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

// Inline one image as a data URI, downscaled to 2x its display size and JPEG-encoded when opaque.
async function inlineImage(url: string, width: number, height: number): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    const original = await blobToDataUri(blob);
    if (blob.size <= 20_000 || blob.type === "image/gif") return original;
    const bmp = await createImageBitmap(blob);
    const target = width ? width * 2 : height ? Math.round((height * 2 * bmp.width) / bmp.height) : bmp.width;
    const scale = Math.min(1, target / bmp.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let opaque = true;
    for (let i = 3; i < px.length; i += 4) if (px[i] < 255) { opaque = false; break; }
    const out = opaque ? canvas.toDataURL("image/jpeg", 0.85) : canvas.toDataURL("image/png");
    return out.length < original.length ? out : original;
  } catch {
    return null;
  }
}

/** Signature HTML with every same-origin image embedded, so recipients never fetch them from our server. */
async function embedImages(html: string): Promise<string> {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const cache = new Map<string, Promise<string | null>>();
  await Promise.all(
    Array.from(doc.querySelectorAll("img")).map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:")) return;
      const key = `${src} ${img.getAttribute("width")} ${img.getAttribute("height")}`;
      if (!cache.has(key)) cache.set(key, inlineImage(src, Number(img.getAttribute("width")) || 0, Number(img.getAttribute("height")) || 0));
      const data = await cache.get(key);
      if (data) img.setAttribute("src", data);
    }),
  );
  return doc.body.innerHTML;
}

// Safari only allows clipboard writes inside the click, so the HTML may be a pending promise.
async function copyHtml(html: string | Promise<string>): Promise<boolean> {
  const pending = Promise.resolve(html);
  try {
    const blob = (type: string) => pending.then((h) => new Blob([h], { type }));
    await navigator.clipboard.write([new ClipboardItem({ "text/html": blob("text/html"), "text/plain": blob("text/plain") })]);
    return true;
  } catch {
    const el = document.createElement("div");
    el.innerHTML = await pending;
    el.style.position = "fixed";
    el.style.left = "-10000px";
    document.body.appendChild(el);
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const ok = document.execCommand("copy");
    sel?.removeAllRanges();
    el.remove();
    return ok;
  }
}

const CLIENTS: Record<string, { label: string; steps: string[] }> = {
  outlook: {
    label: "Outlook",
    steps: [
      "Click \"Copy signature\" above. If photos or the banner show as broken boxes for you or your colleagues, use \"Copy with built-in images\" instead.",
      "New Outlook / Outlook on the web: Settings (gear icon) > Account > Signatures. Classic Outlook for Windows: File > Options > Mail > Signatures.",
      "Click \"+ New signature\", give it a name (e.g. DRE) and paste into the editor (Ctrl+V / Cmd+V).",
      "Under default signatures, choose it for new messages and for replies/forwards, then click Save.",
    ],
  },
  outlookMobile: {
    label: "Outlook app (phone)",
    steps: [
      "Open this page on your phone (or email the link to yourself) and tap \"Copy signature\".",
      "In the Outlook app, tap your profile picture > Settings (gear) > Signature.",
      "Clear the existing text and paste. Images and layout may be simplified on phones.",
    ],
  },
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
    label: "iPhone Mail",
    steps: [
      "Open this page on your phone (or email the link to yourself).",
      "Tap \"Copy signature\".",
      "Go to Settings > Mail > Signature and paste. If the formatting is lost, shake the phone and choose Undo.",
    ],
  },
};

export default function InstallView({ html, fileName, downloadUrl, cardUrl, extra }: { html: string; fileName: string; downloadUrl: string; cardUrl?: string; extra?: React.ReactNode }) {
  const [client, setClient] = useState("outlook");
  const [msg, setMsg] = useState("");

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  }

  async function copyRich() {
    flash((await copyHtml(html)) ? "Signature copied. Paste it into your email client." : "Copy failed. Try again or use Download .html.");
  }

  async function copyEmbedded() {
    setMsg("Embedding images...");
    const ok = await copyHtml(embedImages(html));
    flash(ok ? "Signature copied with images built in. Paste it into Outlook." : "Copy failed. Try again in Chrome or Edge.");
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
        <button className="btn-secondary" onClick={copyEmbedded} title="Photos, banner and icons are stored inside the signature, so they show even where our website is blocked">Copy with built-in images</button>
        <button className="btn-secondary" onClick={copySource}>Copy HTML source</button>
        <a className="btn-secondary" href={downloadUrl} download={fileName}>Download .html</a>
        {cardUrl && <a className="btn-secondary" href={cardUrl} download>Download business card (PDF)</a>}
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
