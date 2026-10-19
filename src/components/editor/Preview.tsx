"use client";

import { useEffect, useMemo, useState } from "react";
import { renderSignature } from "@/lib/signature/render";
import type { SignatureData } from "@/lib/signature/types";

export function useSignatureHtml(data: SignatureData) {
  const [base, setBase] = useState("");
  useEffect(() => setBase(window.location.origin), []);
  return useMemo(() => (base ? renderSignature(data, { baseUrl: base }) : ""), [data, base]);
}

export default function Preview({ data }: { data: SignatureData }) {
  const html = useSignatureHtml(data);
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-stone-200 bg-stone-50 px-4 py-3 text-sm">
        <div className="flex gap-2 text-stone-500"><span className="w-14">To:</span><span className="text-stone-700">client@example.com</span></div>
        <div className="flex gap-2 text-stone-500"><span className="w-14">Subject:</span><span className="text-stone-700">Following up</span></div>
      </div>
      <div className="p-6">
        <p className="mb-6 text-sm text-stone-600">Hi there,<br /><br />Thanks for your time today. Looking forward to working with you.<br /><br />Best regards,</p>
        <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
