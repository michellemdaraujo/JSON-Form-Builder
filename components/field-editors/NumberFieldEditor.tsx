"use client";

import type { FormField } from "@/types/form-schema";
import { TextField } from "../ui/TextField";

type Props = {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
};

export function NumberFieldEditor({ field, onUpdate }: Props) {
  return (
    <TextField
      label="Default Value"
      type="number"
      value={field.defaultValue != null ? String(field.defaultValue) : ""}
      onChange={(e) =>
        onUpdate({
          defaultValue: e.target.value === "" ? undefined : Number(e.target.value),
        } as Partial<FormField>)
      }
    />
  );
}
