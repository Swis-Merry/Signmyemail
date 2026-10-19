import type { SignatureData } from "@/lib/signature/types";

export type Update = (fn: (d: SignatureData) => SignatureData) => void;

export interface TabProps {
  data: SignatureData;
  update: Update;
}
