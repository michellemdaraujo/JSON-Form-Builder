"use client";

import { useState } from "react";
import type { FormField, FieldOption } from "@/types/form-schema";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { toCamelCase } from "@/utils/to-camel-case";

type Props = {
  field: FormField;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<FormField>) => void;
};

export function CheckboxFieldEditor({ field, errors, onUpdate }: Props) {
  const options = "options" in field ? field.options : [];
  const defaultValue = (field.defaultValue as string[]) ?? [];

  const [manuallyEditedValues, setManuallyEditedValues] = useState<Set<number>>(
    () =>
      new Set(
        options
          .map((o, i) =>
            o.value !== "" && o.value !== toCamelCase(o.label) ? i : -1,
          )
          .filter((i) => i >= 0),
      ),
  );

  const handleOptionsChange = (next: FieldOption[]) => {
    onUpdate({ options: next } as Partial<FormField>);
  };

  const updateLabel = (idx: number, label: string) => {
    const next = [...options];
    const autoFillValue = !manuallyEditedValues.has(idx);
    next[idx] = {
      ...next[idx],
      label,
      ...(autoFillValue ? { value: toCamelCase(label) } : {}),
    };
    handleOptionsChange(next);
  };

  const updateValue = (idx: number, value: string) => {
    setManuallyEditedValues((prev) => new Set(prev).add(idx));
    const next = [...options];
    next[idx] = { ...next[idx], value };
    handleOptionsChange(next);
  };

  const toggleDefault = (value: string, checked: boolean) => {
    if (checked) {
      onUpdate({ defaultValue: [...defaultValue, value] } as Partial<FormField>);
    } else {
      onUpdate({
        defaultValue: defaultValue.filter((v) => v !== value),
      } as Partial<FormField>);
    }
  };

  return (
    <div>
      <span className="block text-sm font-medium text-zinc-600 mb-1">
        Options
      </span>
      <div className="space-y-3">
        {options.map((opt, idx) => {
          const isDefault = opt.value !== "" && defaultValue.includes(opt.value);
          return (
            <div key={idx}>
              <div className="flex gap-2 items-center">
                <TextField
                  label="Label"
                  hideLabel
                  placeholder="Label"
                  value={opt.label}
                  onChange={(e) => updateLabel(idx, e.target.value)}
                  className="flex-1"
                />
                <TextField
                  label="Value"
                  hideLabel
                  placeholder="Value"
                  value={opt.value}
                  onChange={(e) => updateValue(idx, e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    const removed = options.filter((_, i) => i !== idx);
                    handleOptionsChange(removed);
                    if (isDefault)
                      onUpdate({
                        defaultValue: defaultValue.filter(
                          (v) => v !== opt.value,
                        ),
                      } as Partial<FormField>);
                  }}
                  disabled={options.length <= 1}
                  className="text-red-400 hover:text-red-600 shrink-0"
                >
                  ✕
                </Button>
              </div>
              <label className="flex items-center gap-1.5 ml-1 mt-0.5 text-xs text-zinc-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => toggleDefault(opt.value, e.target.checked)}
                  disabled={opt.value === ""}
                  className="accent-blue-600"
                />
                Checked by default
              </label>
            </div>
          );
        })}
      </div>
      {errors.options && (
        <p className="text-xs text-red-500 mt-1">{errors.options}</p>
      )}
      <Button
        variant="tertiary"
        size="sm"
        onClick={() =>
          handleOptionsChange([...options, { label: "", value: "" }])
        }
        className="mt-1 text-blue-600 hover:text-blue-800"
      >
        + Add option
      </Button>
    </div>
  );
}
