export type FontSize = "sm" | "md" | "lg" | "xl";
export type Shape = "square" | "rounded" | "circle";
export type IconShape = Shape | "none";
export type IconStyle = "brand" | "custom" | "text";
export type TitleSeparator = "/" | "|" | "at" | "newline";
export type FieldType = "text" | "phone" | "email" | "url";

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: FieldType;
}

export interface Details {
  name: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  fax: string;
  address: string;
  avatarUrl: string;
  customFields: CustomField[];
}

export interface SocialLink {
  id: string;
  network: string;
  url: string;
}

export interface Design {
  templateId: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: FontSize;
  avatarSize: number;
  avatarShape: Shape;
  titleSeparator: TitleSeparator;
  iconStyle: IconStyle;
  iconColor: string;
  iconShape: IconShape;
  width: number;
}

export type Addon =
  | { id: string; type: "banner"; imageUrl: string; link: string; width: number }
  | { id: string; type: "disclaimer"; text: string }
  | { id: string; type: "quote"; text: string; author: string }
  | { id: string; type: "links"; items: { label: string; url: string }[] }
  | { id: string; type: "meeting"; label: string; url: string }
  | { id: string; type: "badges"; items: { imageUrl: string; link: string }[]; height: number }
  | { id: string; type: "mobileapp"; appStoreUrl: string; googlePlayUrl: string };

export type AddonType = Addon["type"];

export interface SignatureData {
  details: Details;
  socials: SocialLink[];
  design: Design;
  addons: Addon[];
}

export const DETAIL_FIELDS = [
  "name",
  "jobTitle",
  "company",
  "email",
  "phone",
  "mobile",
  "website",
  "fax",
  "address",
  "avatarUrl",
] as const satisfies readonly (keyof Details)[];

export type DetailField = (typeof DETAIL_FIELDS)[number];
