import type { Addon, AddonType, Design, Details, SignatureData } from "./types";

export const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { label: "Calibri", value: "Calibri, Candara, Segoe, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Lucida Sans", value: "'Lucida Sans Unicode', 'Lucida Grande', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Palatino", value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Lucida Console", value: "'Lucida Console', Monaco, monospace" },
];

export const FONT_SIZE_PX = { sm: 11, md: 12, lg: 14, xl: 16 } as const;

export const DEFAULT_DESIGN: Design = {
  templateId: "classic",
  primaryColor: "#AB9889",
  secondaryColor: "#AB9889",
  textColor: "#323232",
  fontFamily: FONT_FAMILIES[1].value,
  fontSize: "sm",
  avatarSize: 100,
  avatarShape: "circle",
  titleSeparator: "|",
  iconStyle: "custom",
  iconColor: "#AB9889",
  iconShape: "circle",
  width: 600,
};

export const EMPTY_DETAILS: Details = {
  name: "",
  jobTitle: "",
  company: "",
  email: "",
  phone: "",
  mobile: "",
  website: "",
  fax: "",
  address: "",
  avatarUrl: "",
  customFields: [],
};

export const SAMPLE_DETAILS: Details = {
  name: "Jane Cooper",
  jobTitle: "Marketing Manager",
  company: "Acme Realty",
  email: "jane@example.com",
  phone: "+1 555 010 2030",
  mobile: "+1 555 010 4050",
  website: "www.example.com",
  fax: "",
  address: "100 Market Street, San Francisco, CA",
  avatarUrl: "/sample-avatar.svg",
  customFields: [],
};

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function defaultSignatureData(): SignatureData {
  return {
    details: { ...EMPTY_DETAILS, customFields: [] },
    socials: [],
    design: { ...DEFAULT_DESIGN },
    addons: [],
  };
}

export function isDetailsEmpty(d: Details) {
  return !d.name && !d.jobTitle && !d.company && !d.email && !d.phone && !d.mobile && !d.website && !d.address;
}

export const ADDON_LABELS: Record<AddonType, string> = {
  banner: "Banner",
  badges: "Badges",
  disclaimer: "Disclaimer",
  links: "Links",
  meeting: "Meeting scheduler",
  mobileapp: "Mobile app",
  quote: "Quote",
};

export function newAddon(type: AddonType): Addon {
  const id = newId();
  switch (type) {
    case "banner":
      return { id, type, imageUrl: "", link: "", width: 600 };
    case "badges":
      return { id, type, items: [], height: 60 };
    case "disclaimer":
      return {
        id,
        type,
        text: "This email and any attachments are confidential and intended solely for the addressee.",
      };
    case "links":
      return { id, type, items: [{ label: "Our listings", url: "" }] };
    case "meeting":
      return { id, type, label: "Book a meeting", url: "" };
    case "mobileapp":
      return { id, type, appStoreUrl: "", googlePlayUrl: "" };
    case "quote":
      return { id, type, text: "", author: "" };
  }
}

/** Fills in any keys missing from older or imported records. */
export function normalizeSignatureData(input: Partial<SignatureData> | null | undefined): SignatureData {
  const base = defaultSignatureData();
  return {
    details: { ...base.details, ...(input?.details ?? {}), customFields: input?.details?.customFields ?? [] },
    socials: input?.socials ?? [],
    design: { ...base.design, ...(input?.design ?? {}) },
    addons: input?.addons ?? [],
  };
}
