import { JWT } from "google-auth-library";

const SCOPE = "https://www.googleapis.com/auth/gmail.settings.basic";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const sa = JSON.parse(json) as ServiceAccount;
    return sa.client_email && sa.private_key ? sa : null;
  } catch {
    return null;
  }
}

export function gmailConfigured() {
  return serviceAccount() !== null;
}

export function workspaceDomain() {
  return (process.env.GOOGLE_WORKSPACE_DOMAIN || "").toLowerCase();
}

/** Sets the Gmail signature of `email` (primary send-as address) via domain-wide delegation. */
export async function pushGmailSignature(email: string, html: string) {
  const sa = serviceAccount();
  if (!sa) throw new Error("Google Workspace is not configured.");
  const address = email.trim().toLowerCase();
  if (!address) throw new Error("Signature has no email address.");
  const domain = workspaceDomain();
  if (domain && !address.endsWith("@" + domain)) throw new Error(`${address} is not in the ${domain} Workspace.`);
  const client = new JWT({ email: sa.client_email, key: sa.private_key, scopes: [SCOPE], subject: address });
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs/${encodeURIComponent(address)}`;
  try {
    await client.request({ url, method: "PATCH", data: { signature: html } });
  } catch (e) {
    const err = e as { response?: { data?: { error?: { message?: string } | string; error_description?: string } }; message?: string };
    const data = err.response?.data;
    const detail = typeof data?.error === "string" ? `${data.error}: ${data.error_description ?? ""}` : data?.error?.message;
    throw new Error(detail || err.message || "Gmail API request failed");
  }
}
