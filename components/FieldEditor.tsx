"use client";

import { useState } from "react";
import {
  FIELD_TYPES,
  CUSTOM_RULES,
  type FieldType,
  type FormField,
  type CustomRule,
  type FieldOption,
  type ValidationRule,
  type ConditionalVisibility,
} from "@/types/form-schema";
import { TextField } from "./ui/TextField";
import { Select } from "./ui/Select";
import { Checkbox } from "./ui/Checkbox";
import { Button } from "./ui/Button";
import { toCamelCase } from "@/utils/to-camel-case";

type Props = {
  field: FormField;
  allFields: FormField[];
  errors: Record<string, string>;
  onUpdate: (updates: Partial<FormField>) => void;
};

export function FieldEditor({ field, allFields, errors, onUpdate }: Props) {
  const [nameManuallyEdited, setNameManuallyEdited] = useState(
    field.name !== "" && field.name !== toCamelCase(field.label),
  );
  const isChoice = field.type === "select" || field.type === "radio";
  const isCheckbox = field.type === "checkbox";
  const isNumber = field.type === "number";
  const isDate = field.type === "date";

  const otherFields = allFields.filter((f) => f.id !== field.id);

  const handleLabelChange = (value: string) => {
    const updates: Partial<FormField> = { label: value };
    if (!nameManuallyEdited) {
      updates.name = toCamelCase(value);
    }
    onUpdate(updates);
  };

  const handleNameChange = (value: string) => {
    setNameManuallyEdited(true);
    onUpdate({ name: value });
  };

  return (
    <div className="space-y-5">
      <TextField
        label="Label"
        value={field.label}
        onChange={(e) => handleLabelChange(e.target.value)}
        error={errors.label}
      />

      <TextField
        label="Name"
        value={field.name}
        onChange={(e) => handleNameChange(e.target.value)}
        error={errors.name}
      />

      <Select
        label="Type"
        value={field.type}
        onChange={(e) => {
          const newType = e.target.value as FieldType;
          const base: Partial<FormField> = { type: newType };
          if (newType === "select" || newType === "radio") {
            (base as Record<string, unknown>)["options"] = [
              { label: "Option 1", value: "option1" },
            ];
            (base as Record<string, unknown>)["defaultValue"] = "";
          } else if (newType === "checkbox") {
            (base as Record<string, unknown>)["options"] = [
              { label: "Option 1", value: "option1" },
            ];
            (base as Record<string, unknown>)["defaultValue"] = [];
          } else if (newType === "number") {
            (base as Record<string, unknown>)["defaultValue"] = undefined;
          } else {
            (base as Record<string, unknown>)["defaultValue"] = "";
          }
          onUpdate(base);
        }}
      >
        {(Object.keys(FIELD_TYPES) as FieldType[]).map((t) => (
          <option key={t} value={t}>
            {FIELD_TYPES[t]}
          </option>
        ))}
      </Select>

      {!isCheckbox && (
        <TextField
          label="Placeholder"
          value={field.placeholder ?? ""}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
        />
      )}

      <TextField
        label="Help Text"
        value={field.helpText ?? ""}
        onChange={(e) => onUpdate({ helpText: e.target.value })}
      />

      <Checkbox
        label="Required"
        checked={field.required}
        onChange={(e) => onUpdate({ required: e.target.checked })}
      />

      {isCheckbox ? (
        <CheckboxOptionsEditor
          options={"options" in field ? field.options : []}
          defaultValue={(field.defaultValue as string[]) ?? []}
          onChange={(options) => onUpdate({ options } as Partial<FormField>)}
          onDefaultChange={(value) =>
            onUpdate({ defaultValue: value } as Partial<FormField>)
          }
          error={errors.options}
        />
      ) : isChoice ? (
        <OptionsEditor
          options={"options" in field ? field.options : []}
          defaultValue={(field.defaultValue as string) ?? ""}
          onChange={(options) => onUpdate({ options } as Partial<FormField>)}
          onDefaultChange={(value) =>
            onUpdate({ defaultValue: value } as Partial<FormField>)
          }
          error={errors.options}
        />
      ) : isNumber ? (
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
      ) : isDate ? (
        <TextField
          label="Default Value"
          type="date"
          value={(field.defaultValue as string) ?? ""}
          onChange={(e) =>
            onUpdate({ defaultValue: e.target.value } as Partial<FormField>)
          }
        />
      ) : (
        <TextField
          label="Default Value"
          value={(field.defaultValue as string) ?? ""}
          onChange={(e) =>
            onUpdate({ defaultValue: e.target.value } as Partial<FormField>)
          }
        />
      )}

      <ValidationEditor
        validation={field.validation}
        fieldType={field.type}
        onChange={(validation) => onUpdate({ validation })}
        error={errors.validation}
      />

      <ConditionalEditor
        condition={field.conditionalVisibility}
        otherFields={otherFields}
        onChange={(conditionalVisibility) => onUpdate({ conditionalVisibility })}
      />
    </div>
  );
}

function OptionsEditor({
  options,
  defaultValue,
  onChange,
  onDefaultChange,
  error,
}: {
  options: FieldOption[];
  defaultValue: string;
  onChange: (options: FieldOption[]) => void;
  onDefaultChange: (value: string) => void;
  error?: string;
}) {
  const [manuallyEditedValues, setManuallyEditedValues] = useState<Set<number>>(
    () => new Set(options.map((o, i) => (o.value !== "" && o.value !== toCamelCase(o.label) ? i : -1)).filter((i) => i >= 0)),
  );

  const updateLabel = (idx: number, label: string) => {
    const next = [...options];
    const autoFillValue = !manuallyEditedValues.has(idx);
    next[idx] = { ...next[idx], label, ...(autoFillValue ? { value: toCamelCase(label) } : {}) };
    onChange(next);
  };

  const updateValue = (idx: number, value: string) => {
    setManuallyEditedValues((prev) => new Set(prev).add(idx));
    const next = [...options];
    next[idx] = { ...next[idx], value };
    onChange(next);
  };

  return (
    <div>
      <span className="block text-sm font-medium text-zinc-600 mb-1">
        Options
      </span>
      <div className="space-y-3">
        {options.map((opt, idx) => {
          const isDefault = defaultValue === opt.value && opt.value !== "";
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
                    onChange(removed);
                    if (isDefault) onDefaultChange("");
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
                  onChange={(e) => onDefaultChange(e.target.checked ? opt.value : "")}
                  disabled={opt.value === ""}
                  className="accent-blue-600"
                />
                Make default option
              </label>
            </div>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => onChange([...options, { label: "", value: "" }])}
        className="mt-1 text-blue-600 hover:text-blue-800"
      >
        + Add option
      </Button>
    </div>
  );
}

function CheckboxOptionsEditor({
  options,
  defaultValue,
  onChange,
  onDefaultChange,
  error,
}: {
  options: FieldOption[];
  defaultValue: string[];
  onChange: (options: FieldOption[]) => void;
  onDefaultChange: (value: string[]) => void;
  error?: string;
}) {
  const [manuallyEditedValues, setManuallyEditedValues] = useState<Set<number>>(
    () => new Set(options.map((o, i) => (o.value !== "" && o.value !== toCamelCase(o.label) ? i : -1)).filter((i) => i >= 0)),
  );

  const updateLabel = (idx: number, label: string) => {
    const next = [...options];
    const autoFillValue = !manuallyEditedValues.has(idx);
    next[idx] = { ...next[idx], label, ...(autoFillValue ? { value: toCamelCase(label) } : {}) };
    onChange(next);
  };

  const updateValue = (idx: number, value: string) => {
    setManuallyEditedValues((prev) => new Set(prev).add(idx));
    const next = [...options];
    next[idx] = { ...next[idx], value };
    onChange(next);
  };

  const toggleDefault = (value: string, checked: boolean) => {
    if (checked) {
      onDefaultChange([...defaultValue, value]);
    } else {
      onDefaultChange(defaultValue.filter((v) => v !== value));
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
                    onChange(removed);
                    if (isDefault) onDefaultChange(defaultValue.filter((v) => v !== opt.value));
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
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => onChange([...options, { label: "", value: "" }])}
        className="mt-1 text-blue-600 hover:text-blue-800"
      >
        + Add option
      </Button>
    </div>
  );
}

function ValidationEditor({
  validation,
  fieldType,
  onChange,
  error,
}: {
  validation?: ValidationRule;
  fieldType: FieldType;
  onChange: (v?: ValidationRule) => void;
  error?: string;
}) {
  const v = validation ?? {};
  const set = (updates: Partial<ValidationRule>) => {
    const next = { ...v, ...updates };
    const isEmpty = next.min == null && next.max == null && !next.regex && !next.custom;
    onChange(isEmpty ? undefined : next);
  };

  const showMinMax = fieldType === "text" || fieldType === "textarea" || fieldType === "number";
  const showRegex = fieldType === "text" || fieldType === "textarea";
  const showCustom = fieldType === "text" || fieldType === "textarea";

  if (!showMinMax && !showRegex && !showCustom) return null;

  const minLabel = fieldType === "number" ? "Min Value" : "Min Length";
  const maxLabel = fieldType === "number" ? "Max Value" : "Max Length";

  return (
    <div>
      <span className="block text-sm font-medium text-zinc-600 mb-1">
        Validation
      </span>
      <div className="space-y-2 pl-2 border-l-2 border-zinc-300">
        {showMinMax && (
          <div className="flex gap-3">
            <TextField
              label={minLabel}
              type="number"
              value={v.min ?? ""}
              onChange={(e) =>
                set({ min: e.target.value === "" ? undefined : Number(e.target.value) })
              }
              className="w-28"
            />
            <TextField
              label={maxLabel}
              type="number"
              value={v.max ?? ""}
              onChange={(e) =>
                set({ max: e.target.value === "" ? undefined : Number(e.target.value) })
              }
              className="w-28"
            />
          </div>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}

        {showRegex && (
          <TextField
            label="Regex"
            placeholder="e.g. ^[A-Z]"
            value={v.regex ?? ""}
            onChange={(e) => set({ regex: e.target.value || undefined })}
          />
        )}

        {showCustom && (
          <Select
            label="Custom Rule"
            value={v.custom ?? ""}
            onChange={(e) =>
              set({
                custom: (e.target.value || undefined) as CustomRule | undefined,
              })
            }
          >
            <option value="">None</option>
            {(Object.keys(CUSTOM_RULES) as CustomRule[]).map((rule) => (
              <option key={rule} value={rule}>
                {CUSTOM_RULES[rule]}
              </option>
            ))}
          </Select>
        )}
      </div>
    </div>
  );
}

function ConditionalEditor({
  condition,
  otherFields,
  onChange,
}: {
  condition?: ConditionalVisibility;
  otherFields: FormField[];
  onChange: (c?: ConditionalVisibility) => void;
}) {
  if (otherFields.length === 0) return null;

  const enabled = !!condition;

  return (
    <div>
      <Checkbox
        label={
          <span className="font-medium text-zinc-600">
            Conditional Visibility
          </span>
        }
        checked={enabled}
        onChange={(e) => {
          if (e.target.checked) {
            onChange({ fieldName: otherFields[0].name, value: "" });
          } else {
            onChange(undefined);
          }
        }}
      />

      {enabled && condition && (
        <div className="pl-2 border-l-2 border-zinc-300 space-y-2 mt-2">
          <Select
            label="Show when field"
            value={condition.fieldName}
            onChange={(e) =>
              onChange({ ...condition, fieldName: e.target.value })
            }
          >
            {otherFields.map((f) => (
              <option key={f.id} value={f.name}>
                {f.label} ({f.name})
              </option>
            ))}
          </Select>
          <TextField
            label="Equals value"
            value={String(condition.value)}
            onChange={(e) =>
              onChange({ ...condition, value: e.target.value })
            }
          />
        </div>
      )}
    </div>
  );
}
