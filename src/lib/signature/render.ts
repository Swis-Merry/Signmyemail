import { FONT_SIZE_PX } from "./defaults";
import { SOCIAL_NETWORKS } from "./socials";
import type { Addon, CustomField, Design, Details, FieldType, SignatureData } from "./types";

export interface RenderOptions {
  baseUrl: string;
}

interface Ctx {
  d: Details;
  s: SignatureData["socials"];
  x: Design;
  base: string;
  fs: number;
}

export function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function absUrl(url: string, base: string): string {
  const u = (url || "").trim();
  if (!u) return "";
  if (/^(https?:|mailto:|tel:|data:)/i.test(u)) return u;
  if (u.startsWith("/")) return base.replace(/\/$/, "") + u;
  return "https://" + u;
}

export function hrefFor(type: FieldType, value: string, base: string): string {
  if (type === "phone") return "tel:" + value.replace(/[^\d+]/g, "");
  if (type === "email") return "mailto:" + value.trim();
  if (type === "url") return absUrl(value, base);
  return "";
}

const hex = (c: string) => c.replace("#", "");
const trimBase = (base: string) => base.replace(/\/$/, "");

function avatarSrc(c: Ctx): string {
  const params = new URLSearchParams({ src: absUrl(c.d.avatarUrl, c.base), size: String(c.x.avatarSize), shape: c.x.avatarShape });
  return `${trimBase(c.base)}/api/avatar?${params.toString()}`;
}

function iconSrc(c: Ctx, network: string): string {
  const color = c.x.iconStyle === "brand" ? SOCIAL_NETWORKS[network]?.color ?? "#555555" : c.x.iconColor;
  const params = new URLSearchParams({ color: hex(color), shape: c.x.iconShape });
  return `${trimBase(c.base)}/api/icon/${encodeURIComponent(network)}?${params.toString()}`;
}

const p = (style: string, inner: string) => `<p style="margin:0;${style}">${inner}</p>`;
const spacer = (h: number) => `<div style="height:${h}px;line-height:${h}px;font-size:1px;">&nbsp;</div>`;
const table = (inner: string, style = "") =>
  `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;${style}">${inner}</table>`;

function baseText(c: Ctx, delta = 0) {
  const size = c.fs + delta;
  return `font-family:${c.x.fontFamily};font-size:${size}px;line-height:${size + 5}px;color:${c.x.textColor};`;
}

interface NameOpts {
  color?: string;
  delta?: number;
  bold?: boolean;
  upper?: boolean;
}

function nameHtml(c: Ctx, o: NameOpts = {}) {
  if (!c.d.name) return "";
  const style = `${baseText(c, o.delta ?? 4)}color:${o.color ?? c.x.primaryColor};font-weight:${o.bold ? "bold" : "normal"};${o.upper ? "text-transform:uppercase;letter-spacing:1px;" : ""}`;
  return p(style, esc(c.d.name));
}

function titleHtml(c: Ctx, color?: string) {
  const { jobTitle, company } = c.d;
  if (!jobTitle && !company) return "";
  const sep = c.x.titleSeparator;
  let inner = esc(jobTitle);
  if (jobTitle && company) inner += sep === "newline" ? "<br>" : ` ${esc(sep)} `;
  if (company) inner += `<strong>${esc(company)}</strong>`;
  return p(`${baseText(c)}${color ? `color:${color};` : ""}`, inner);
}

interface Item {
  label: string;
  value: string;
  type: FieldType;
}

const item = (label: string, value: string, type: FieldType): Item[] => (value ? [{ label, value, type }] : []);
const customItems = (fields: CustomField[]): Item[] =>
  fields.filter((f) => f.value).map((f) => ({ label: f.label, value: f.value, type: f.type }));

function contactGroups(d: Details): Item[][] {
  return [
    item("A", d.address, "text"),
    [...item("P", d.phone, "phone"), ...item("M", d.mobile, "phone")],
    [...item("E", d.email, "email"), ...item("W", d.website, "url")],
    [...item("F", d.fax, "phone"), ...customItems(d.customFields)],
  ].filter((g) => g.length);
}

function itemHtml(c: Ctx, it: Item, showLabel = true) {
  const href = hrefFor(it.type, it.value, c.base);
  const value = href
    ? `<a href="${esc(href)}" style="color:${c.x.textColor};text-decoration:none;">${esc(it.value)}</a>`
    : esc(it.value);
  const label = showLabel ? `<span style="color:${c.x.secondaryColor};font-weight:bold;">${esc(it.label)}:</span> ` : "";
  return it.type === "text" ? `${label}${value}` : `<span style="white-space:nowrap;">${label}${value}</span>`;
}

function contactLines(c: Ctx, align?: string) {
  return contactGroups(c.d)
    .map((g) => p(`${baseText(c)}padding-top:2px;${align ? `text-align:${align};` : ""}`, g.map((it) => itemHtml(c, it)).join("&nbsp;&nbsp;&nbsp;")))
    .join("");
}

function inlineContacts(c: Ctx) {
  const all = contactGroups(c.d).flat();
  if (!all.length) return "";
  const sep = `<span style="color:${c.x.secondaryColor};">&nbsp;|&nbsp;</span>`;
  return p(baseText(c), all.map((it) => itemHtml(c, it, false)).join(sep));
}

function socialsHtml(c: Ctx, align: "left" | "center" = "left") {
  const links = c.s.filter((l) => l.url);
  if (!links.length) return "";
  const label = (n: string) => SOCIAL_NETWORKS[n]?.label ?? n;
  if (c.x.iconStyle === "text") {
    const inner = links
      .map((l) => `<a href="${esc(absUrl(l.url, c.base))}" style="color:${c.x.iconColor};text-decoration:none;font-weight:bold;">${esc(label(l.network))}</a>`)
      .join(`<span style="color:${c.x.textColor};">&nbsp;&middot;&nbsp;</span>`);
    return p(`${baseText(c)}padding-top:8px;text-align:${align};`, inner);
  }
  const cells = links
    .map(
      (l) =>
        `<td style="padding:0 4px 0 0;"><a href="${esc(absUrl(l.url, c.base))}"><img src="${esc(iconSrc(c, l.network))}" width="22" height="22" alt="${esc(label(l.network))}" style="display:block;border:0;width:22px;height:22px;"></a></td>`,
    )
    .join("");
  return `<table cellpadding="0" cellspacing="0" border="0" align="${align}" style="border-collapse:collapse;margin-top:8px;"><tr>${cells}</tr></table>`;
}

function avatarHtml(c: Ctx) {
  if (!c.d.avatarUrl) return "";
  const size = c.x.avatarSize;
  const img = `<img src="${esc(avatarSrc(c))}" width="${size}" height="${size}" alt="${esc(c.d.name)}" style="display:block;border:0;width:${size}px;height:${size}px;">`;
  return c.d.website ? `<a href="${esc(absUrl(c.d.website, c.base))}">${img}</a>` : img;
}

const textBlock = (c: Ctx) => nameHtml(c) + titleHtml(c) + spacer(6) + contactLines(c) + socialsHtml(c);

type TemplateFn = (c: Ctx) => string;

const templates: Record<string, { name: string; render: TemplateFn }> = {
  classic: {
    name: "Classic: photo + divider",
    render: (c) => {
      const a = avatarHtml(c);
      const photo = a ? `<td valign="top" style="padding-right:14px;border-right:3px solid ${c.x.primaryColor};">${a}</td>` : "";
      return table(`<tr>${photo}<td valign="top" style="padding-left:${a ? 14 : 0}px;">${textBlock(c)}</td></tr>`);
    },
  },
  rightPhoto: {
    name: "Photo on the right",
    render: (c) => {
      const a = avatarHtml(c);
      const border = a ? `padding-right:14px;border-right:3px solid ${c.x.primaryColor};` : "";
      return table(`<tr><td valign="top" style="${border}">${textBlock(c)}</td>${a ? `<td valign="top" style="padding-left:14px;">${a}</td>` : ""}</tr>`);
    },
  },
  stacked: {
    name: "Stacked: photo on top",
    render: (c) => {
      const a = avatarHtml(c);
      return table(`${a ? `<tr><td style="padding-bottom:10px;">${a}</td></tr>` : ""}<tr><td>${textBlock(c)}</td></tr>`);
    },
  },
  centered: {
    name: "Centered",
    render: (c) => {
      const a = avatarHtml(c);
      const body = nameHtml(c) + titleHtml(c) + spacer(6) + contactLines(c, "center") + socialsHtml(c, "center");
      return table(`${a ? `<tr><td align="center" style="padding-bottom:10px;">${a}</td></tr>` : ""}<tr><td align="center" style="text-align:center;">${body}</td></tr>`);
    },
  },
  minimal: {
    name: "Minimal (no photo)",
    render: (c) =>
      table(`<tr><td>${nameHtml(c, { bold: true, color: c.x.textColor, delta: 3 })}${titleHtml(c, c.x.primaryColor)}${spacer(4)}${inlineContacts(c)}${socialsHtml(c)}</td></tr>`),
  },
  headerBar: {
    name: "Colored header bar",
    render: (c) => {
      const a = avatarHtml(c);
      const bar = `<tr><td colspan="2" style="background:${c.x.primaryColor};padding:8px 12px;">${nameHtml(c, { color: "#ffffff", bold: true })}${titleHtml(c, "#ffffff")}</td></tr>`;
      return table(`${bar}<tr>${a ? `<td valign="top" style="padding:10px 12px 0 0;">${a}</td>` : ""}<td valign="top" style="padding-top:10px;">${contactLines(c)}${socialsHtml(c)}</td></tr>`);
    },
  },
  underline: {
    name: "Name with underline",
    render: (c) =>
      table(
        `<tr><td style="padding-bottom:6px;border-bottom:2px solid ${c.x.primaryColor};">${nameHtml(c, { bold: true, delta: 6 })}${titleHtml(c)}</td></tr><tr><td style="padding-top:6px;">${contactLines(c)}${socialsHtml(c)}</td></tr>`,
      ),
  },
  twoColumn: {
    name: "Two columns",
    render: (c) => {
      const a = avatarHtml(c);
      return table(
        `<tr><td valign="top" style="padding-right:14px;border-right:1px solid ${c.x.secondaryColor};">${a ? `<div style="padding-bottom:8px;">${a}</div>` : ""}${nameHtml(c, { bold: true })}${titleHtml(c)}${socialsHtml(c)}</td><td valign="top" style="padding-left:14px;">${contactLines(c)}</td></tr>`,
      );
    },
  },
  bold: {
    name: "Bold uppercase",
    render: (c) => {
      const a = avatarHtml(c);
      return table(
        `<tr>${a ? `<td valign="middle" style="padding-right:16px;">${a}</td>` : ""}<td valign="middle">${nameHtml(c, { bold: true, upper: true, delta: 6 })}${titleHtml(c, c.x.secondaryColor)}${spacer(8)}${contactLines(c)}${socialsHtml(c)}</td></tr>`,
      );
    },
  },
  compact: {
    name: "Compact",
    render: (c) => {
      const a = avatarHtml(c);
      return table(`<tr>${a ? `<td valign="top" style="padding-right:10px;">${a}</td>` : ""}<td valign="top">${nameHtml(c, { bold: true, delta: 2 })}${titleHtml(c)}${inlineContacts(c)}${socialsHtml(c)}</td></tr>`);
    },
  },
};

export const TEMPLATE_OPTIONS = Object.entries(templates).map(([id, t]) => ({ id, name: t.name }));

function button(c: Ctx, label: string, url: string, bg = c.x.primaryColor) {
  return table(
    `<tr><td style="background:${bg};border-radius:4px;padding:6px 14px;"><a href="${esc(absUrl(url, c.base))}" style="${baseText(c)}color:#ffffff;text-decoration:none;font-weight:bold;">${esc(label)}</a></td></tr>`,
  );
}

function linkedImg(c: Ctx, img: string, link: string) {
  return link ? `<a href="${esc(absUrl(link, c.base))}">${img}</a>` : img;
}

function addonHtml(c: Ctx, a: Addon): string {
  const row = (inner: string) => (inner ? `<tr><td style="padding-top:12px;">${inner}</td></tr>` : "");
  switch (a.type) {
    case "banner": {
      if (!a.imageUrl) return "";
      const img = `<img src="${esc(absUrl(a.imageUrl, c.base))}" width="${a.width}" alt="" style="display:block;border:0;width:${a.width}px;max-width:100%;height:auto;">`;
      return row(linkedImg(c, img, a.link));
    }
    case "badges": {
      const cells = a.items
        .filter((b) => b.imageUrl)
        .map((b) => {
          const img = `<img src="${esc(absUrl(b.imageUrl, c.base))}" height="${a.height}" alt="" style="display:block;border:0;height:${a.height}px;">`;
          return `<td style="padding-right:8px;">${linkedImg(c, img, b.link)}</td>`;
        })
        .join("");
      return cells ? row(table(`<tr>${cells}</tr>`)) : "";
    }
    case "disclaimer":
      return a.text ? row(p(`${baseText(c, -2)}color:#8a8a8a;max-width:${c.x.width}px;`, esc(a.text).replace(/\n/g, "<br>"))) : "";
    case "quote":
      return a.text
        ? row(p(`${baseText(c)}font-style:italic;color:#666666;`, `&ldquo;${esc(a.text)}&rdquo;${a.author ? ` &mdash; ${esc(a.author)}` : ""}`))
        : "";
    case "links": {
      const links = a.items.filter((l) => l.label && l.url);
      if (!links.length) return "";
      const sep = `<span style="color:${c.x.secondaryColor};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`;
      return row(
        p(
          baseText(c),
          links
            .map((l) => `<a href="${esc(absUrl(l.url, c.base))}" style="color:${c.x.primaryColor};text-decoration:none;font-weight:bold;">${esc(l.label)}</a>`)
            .join(sep),
        ),
      );
    }
    case "meeting":
      return a.url ? row(button(c, a.label || "Book a meeting", a.url)) : "";
    case "mobileapp": {
      const btns = [
        a.appStoreUrl ? button(c, "Download on the App Store", a.appStoreUrl, "#111111") : "",
        a.googlePlayUrl ? button(c, "Get it on Google Play", a.googlePlayUrl, "#111111") : "",
      ].filter(Boolean);
      return btns.length ? row(table(`<tr>${btns.map((b) => `<td style="padding-right:8px;">${b}</td>`).join("")}</tr>`)) : "";
    }
  }
}

export function renderSignature(data: SignatureData, opts: RenderOptions): string {
  const c: Ctx = { d: data.details, s: data.socials, x: data.design, base: opts.baseUrl, fs: FONT_SIZE_PX[data.design.fontSize] ?? 12 };
  const tpl = templates[data.design.templateId] ?? templates.classic;
  const addons = data.addons.map((a) => addonHtml(c, a)).join("");
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${c.x.fontFamily};max-width:${c.x.width}px;"><tr><td>${tpl.render(c)}</td></tr>${addons}</table>`;
}
