export function GmailResult({ status, msg }: { status?: string; msg?: string }) {
  if (status === "ok") {
    return (
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Done. Your signature is now installed in Gmail, on the web and in the Gmail mobile app.
      </div>
    );
  }
  if (status === "error") {
    return <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{msg || "Something went wrong."}</div>;
  }
  return null;
}

export function GmailConnectButton({ token }: { token?: string }) {
  const href = `/api/public/gmail/connect${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  return (
    <a href={href} className="btn-primary inline-flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
        <path fill="#fff" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z" />
        <path fill="#fff" fillOpacity=".8" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
        <path fill="#fff" fillOpacity=".6" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6z" />
        <path fill="#fff" fillOpacity=".9" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6C6.5 42.6 14.6 48 24 48z" />
      </svg>
      Install in Gmail automatically
    </a>
  );
}
