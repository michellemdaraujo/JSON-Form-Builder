"use client";

import { useState } from "react";
import {
  FIELD_TYPES,
  CUSTOM_RULES,
  type FieldType,
  type FormField,
  type CustomRule,
  type ValidationRule,
  type ConditionalVisibility,
  type TextConditionRule,
  type NumberConditionRule,
} from "@/types/form-schema";
import { TextField } from "./ui/TextField";
import { Select } from "./ui/Select";
import { Checkbox } from "./ui/Checkbox";
import { Button } from "./ui/Button";
import { toCamelCase } from "@/utils/to-camel-case";
import { TextFieldEditor } from "./field-editors/TextFieldEditor";
import { NumberFieldEditor } from "./field-editors/NumberFieldEditor";
import { DateFieldEditor } from "./field-editors/DateFieldEditor";
import { ChoiceFieldEditor } from "./field-editors/ChoiceFieldEditor";
import { CheckboxFieldEditor } from "./field-editors/CheckboxFieldEditor";

type Props = {
  field: FormField;
  allFields: FormField[];
  errors: Record<string, string>;
  onUpdate: (updates: Partial<FormField>) => void;
};

function TypeSpecificEditor({
  field,
  errors,
  onUpdate,
}: {
  field: FormField;
  errors: Record<string, string>;
  onUpdate: (updates: Partial<FormField>) => void;
}) {
  switch (field.type) {
    case "text":
    case "textarea":
      return <TextFieldEditor field={field} onUpdate={onUpdate} />;
    case "number":
      return <NumberFieldEditor field={field} onUpdate={onUpdate} />;
    case "date":
      return <DateFieldEditor field={field} onUpdate={onUpdate} />;
    case "select":
    case "radio":
      return <ChoiceFieldEditor field={field} errors={errors} onUpdate={onUpdate} />;
    case "checkbox":
      return <CheckboxFieldEditor field={field} errors={errors} onUpdate={onUpdate} />;
  }
}

export function FieldEditor({ field, allFields, errors, onUpdate }: Props) {
  const [nameManuallyEdited, setNameManuallyEdited] = useState(
    field.name !== "" && field.name !== toCamelCase(field.label),
  );
  const isCheckbox = field.type === "checkbox";

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

      <TypeSpecificEditor field={field} errors={errors} onUpdate={onUpdate} />

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
    const isEmpty = next.min == null && next.max == null && !next.regex && !next.custom && !next.minDate && !next.maxDate;
    onChange(isEmpty ? undefined : next);
  };

  const showMinMax = fieldType === "text" || fieldType === "textarea" || fieldType === "number";
  const showRegex = fieldType === "text" || fieldType === "textarea";
  const showCustom = fieldType === "text" || fieldType === "textarea";
  const showDateRange = fieldType === "date";

  if (!showMinMax && !showRegex && !showCustom && !showDateRange) return null;

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
        {showDateRange && (
          <>
            <div className="flex gap-4">
              <Checkbox
                label="Only allow future dates"
                checked={v.dateRestriction === "future"}
                onChange={(e) =>
                  set({ dateRestriction: e.target.checked ? "future" : undefined })
                }
              />
              <Checkbox
                label="Only allow past dates"
                checked={v.dateRestriction === "past"}
                onChange={(e) =>
                  set({ dateRestriction: e.target.checked ? "past" : undefined })
                }
              />
            </div>
            <div className="flex gap-3">
              <TextField
                label="Min Date"
                type="date"
                value={v.minDate ?? ""}
                onChange={(e) =>
                  set({ minDate: e.target.value || undefined })
                }
                className="flex-1"
              />
              <TextField
                label="Max Date"
                type="date"
                value={v.maxDate ?? ""}
                onChange={(e) =>
                  set({ maxDate: e.target.value || undefined })
                }
                className="flex-1"
              />
            </div>
          </>
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

const TEXT_OPERATORS = { equals: "Equals", includes: "Includes" } as const;
const NUMBER_OPERATORS = {
  eq: "Equal",
  lt: "Less than",
  gt: "Greater than",
  lte: "Less or equal",
  gte: "Greater or equal",
} as const;

function buildDefaultCondition(
  fieldName: string,
  targetField: FormField,
  logic: "and" | "or" = "or",
): ConditionalVisibility {
  switch (targetField.type) {
    case "text":
    case "textarea":
      return { fieldName, logic, conditionType: "text", rules: [{ operator: "equals", value: "" }] };
    case "number":
      return { fieldName, logic, conditionType: "number", rules: [{ operator: "eq", value: 0 }] };
    case "select":
    case "radio":
    case "checkbox":
      return { fieldName, logic, conditionType: "choice", values: [] };
    case "date":
      return { fieldName, logic, conditionType: "date" };
  }
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
  const targetField = enabled
    ? otherFields.find((f) => f.name === condition.fieldName)
    : undefined;

  const handleFieldChange = (fieldName: string) => {
    const newTarget = otherFields.find((f) => f.name === fieldName);
    if (!newTarget) return;
    onChange(buildDefaultCondition(fieldName, newTarget, condition?.logic));
  };

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
            const target = otherFields[0];
            onChange(buildDefaultCondition(target.name, target));
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
            onChange={(e) => handleFieldChange(e.target.value)}
          >
            {otherFields.map((f) => (
              <option key={f.id} value={f.name}>
                {f.label} ({f.name})
              </option>
            ))}
          </Select>

          {condition.conditionType === "text" && (
            <TextConditionEditor
              rules={condition.rules}
              logic={condition.logic}
              onChange={(rules, logic) =>
                onChange({ ...condition, rules, logic } as ConditionalVisibility)
              }
            />
          )}

          {condition.conditionType === "number" && (
            <NumberConditionEditor
              rules={condition.rules}
              logic={condition.logic}
              onChange={(rules, logic) =>
                onChange({ ...condition, rules, logic } as ConditionalVisibility)
              }
            />
          )}

          {condition.conditionType === "choice" && targetField && (
            <ChoiceConditionEditor
              values={condition.values}
              targetField={targetField}
              logic={condition.logic}
              onChange={(values, logic) =>
                onChange({ ...condition, values, logic } as ConditionalVisibility)
              }
            />
          )}

          {condition.conditionType === "date" && (
            <DateConditionEditor
              start={condition.start}
              end={condition.end}
              onChange={(start, end) =>
                onChange({ ...condition, start, end } as ConditionalVisibility)
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function LogicToggle({
  logic,
  onChange,
}: {
  logic: "and" | "or";
  onChange: (logic: "and" | "or") => void;
}) {
  return (
    <Select
      label="Match"
      value={logic}
      onChange={(e) => onChange(e.target.value as "and" | "or")}
      className="w-32"
    >
      <option value="or">Any (OR)</option>
      <option value="and">All (AND)</option>
    </Select>
  );
}

function TextConditionEditor({
  rules,
  logic,
  onChange,
}: {
  rules: TextConditionRule[];
  logic: "and" | "or";
  onChange: (rules: TextConditionRule[], logic: "and" | "or") => void;
}) {
  const updateRule = (idx: number, updates: Partial<TextConditionRule>) => {
    const next = [...rules];
    next[idx] = { ...next[idx], ...updates };
    onChange(next, logic);
  };

  const removeRule = (idx: number) => {
    onChange(rules.filter((_, i) => i !== idx), logic);
  };

  return (
    <div className="space-y-2">
      {rules.length > 1 && (
        <LogicToggle logic={logic} onChange={(l) => onChange(rules, l)} />
      )}
      {rules.map((rule, idx) => (
        <div key={idx} className="flex gap-2 items-end">
          <Select
            label="Operator"
            hideLabel={idx > 0}
            value={rule.operator}
            onChange={(e) =>
              updateRule(idx, {
                operator: e.target.value as TextConditionRule["operator"],
              })
            }
            className="w-28"
          >
            {Object.entries(TEXT_OPERATORS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
          <TextField
            label="Value"
            hideLabel={idx > 0}
            value={rule.value}
            onChange={(e) => updateRule(idx, { value: e.target.value })}
            className="flex-1"
          />
          {rules.length > 1 && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => removeRule(idx)}
              className="text-red-400 hover:text-red-600 shrink-0"
            >
              ✕
            </Button>
          )}
        </div>
      ))}
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => onChange([...rules, { operator: "equals", value: "" }], logic)}
        className="text-blue-600 hover:text-blue-800"
      >
        + Add condition
      </Button>
    </div>
  );
}

function NumberConditionEditor({
  rules,
  logic,
  onChange,
}: {
  rules: NumberConditionRule[];
  logic: "and" | "or";
  onChange: (rules: NumberConditionRule[], logic: "and" | "or") => void;
}) {
  const updateRule = (idx: number, updates: Partial<NumberConditionRule>) => {
    const next = [...rules];
    next[idx] = { ...next[idx], ...updates };
    onChange(next, logic);
  };

  const removeRule = (idx: number) => {
    onChange(rules.filter((_, i) => i !== idx), logic);
  };

  return (
    <div className="space-y-2">
      {rules.length > 1 && (
        <LogicToggle logic={logic} onChange={(l) => onChange(rules, l)} />
      )}
      {rules.map((rule, idx) => (
        <div key={idx} className="flex gap-2 items-end">
          <Select
            label="Operator"
            hideLabel={idx > 0}
            value={rule.operator}
            onChange={(e) =>
              updateRule(idx, {
                operator: e.target.value as NumberConditionRule["operator"],
              })
            }
            className="w-36"
          >
            {Object.entries(NUMBER_OPERATORS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
          <TextField
            label="Value"
            hideLabel={idx > 0}
            type="number"
            value={rule.value}
            onChange={(e) =>
              updateRule(idx, {
                value: e.target.value === "" ? 0 : Number(e.target.value),
              })
            }
            className="flex-1"
          />
          {rules.length > 1 && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => removeRule(idx)}
              className="text-red-400 hover:text-red-600 shrink-0"
            >
              ✕
            </Button>
          )}
        </div>
      ))}
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => onChange([...rules, { operator: "eq", value: 0 }], logic)}
        className="text-blue-600 hover:text-blue-800"
      >
        + Add condition
      </Button>
    </div>
  );
}

function ChoiceConditionEditor({
  values,
  targetField,
  logic,
  onChange,
}: {
  values: string[];
  targetField: FormField;
  logic: "and" | "or";
  onChange: (values: string[], logic: "and" | "or") => void;
}) {
  const options = "options" in targetField ? targetField.options : [];

  const toggle = (value: string, checked: boolean) => {
    const next = checked
      ? [...values, value]
      : values.filter((v) => v !== value);
    onChange(next, logic);
  };

  return (
    <div className="space-y-2">
      {options.length > 1 && (
        <LogicToggle logic={logic} onChange={(l) => onChange(values, l)} />
      )}
      <span className="block text-sm font-medium text-zinc-600">
        Has value
      </span>
      <div className="space-y-1">
        {options.map((opt) => (
          <Checkbox
            key={opt.value}
            label={opt.label || opt.value}
            checked={values.includes(opt.value)}
            onChange={(e) => toggle(opt.value, e.target.checked)}
          />
        ))}
        {options.length === 0 && (
          <p className="text-xs text-zinc-400">
            No options defined on the target field.
          </p>
        )}
      </div>
    </div>
  );
}

function DateConditionEditor({
  start,
  end,
  onChange,
}: {
  start?: string;
  end?: string;
  onChange: (start?: string, end?: string) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-zinc-600">
        Date range
      </span>
      <div className="flex gap-3">
        <TextField
          label="From"
          type="date"
          value={start ?? ""}
          onChange={(e) => onChange(e.target.value || undefined, end)}
          className="flex-1"
        />
        <TextField
          label="To"
          type="date"
          value={end ?? ""}
          onChange={(e) => onChange(start, e.target.value || undefined)}
          className="flex-1"
        />
      </div>
    </div>
  );
}
