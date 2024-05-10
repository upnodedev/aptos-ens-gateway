import { ReactNode } from "react";

export interface FieldValue {
  field: string;
  value: string;
}

export interface ValueLabel {
  value: string;
  label: ReactNode;
}