"use client";

import type { FormField } from "@/types/form-schema";
import { TextField } from "../ui/TextField";

type Props = {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
};

export function DateFieldEditor({ field, onUpdate }: Props) {
  return (
    <TextField
      label="Default Value"
      type="date"
      value={(field.defaultValue as string) ?? ""}
      onChange={(e) =>
        onUpdate({ defaultValue: e.target.value } as Partial<FormField>)
      }
    />
  );
}
