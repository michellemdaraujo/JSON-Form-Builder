"use client";

import type { FormField, ConditionalVisibility } from "@/types/form-schema";
import { FIELD_TYPES, CUSTOM_RULES } from "@/types/form-schema";
import { Button } from "./ui/Button";

const OPERATOR_LABELS: Record<string, string> = {
  equals: "equals",
  includes: "includes",
  eq: "=",
  lt: "<",
  gt: ">",
  lte: "<=",
  gte: ">=",
};

function formatConditionSummary(cv: ConditionalVisibility): string {
  const joiner = cv.logic === "and" ? " AND " : " OR ";
  const prefix = `Visible when ${cv.fieldName} `;

  switch (cv.conditionType) {
    case "text":
      return prefix + cv.rules
        .map((r) => `${OPERATOR_LABELS[r.operator]} "${r.value}"`)
        .join(joiner);
    case "number":
      return prefix + cv.rules
        .map((r) => `${OPERATOR_LABELS[r.operator]} ${r.value}`)
        .join(joiner);
    case "choice":
      return prefix + `is ${cv.values.join(joiner)}`;
    case "date": {
      if (cv.start && cv.end) return prefix + `between ${cv.start} and ${cv.end}`;
      if (cv.start) return prefix + `from ${cv.start}`;
      if (cv.end) return prefix + `until ${cv.end}`;
      return prefix + "has date";
    }
  }
}

type Props = {
  field: FormField;
  onEdit: () => void;
  onDelete: () => void;
  dragHandleProps?: Record<string, unknown>;
};

export function FieldCard({ field, onEdit, onDelete, dragHandleProps }: Props) {
  const hasValidation = field.required || field.validation || field.conditionalVisibility;

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 md:p-4 shadow-sm flex gap-3 md:gap-4 items-start">
      {/* Drag handle */}
      <div
        className="flex items-start pt-0.5 cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 shrink-0"
        {...dragHandleProps}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="2" r="1.5" />
          <circle cx="11" cy="2" r="1.5" />
          <circle cx="5" cy="7" r="1.5" />
          <circle cx="11" cy="7" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="11" cy="12" r="1.5" />
        </svg>
      </div>

      {/* Properties */}
      <div className="flex-1 min-w-0 flex flex-col md:flex-row gap-2 md:gap-6">
        {/* Left: Basic info */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <PropertyRow label="Label" value={field.label} />
          <PropertyRow label="Name" value={field.name} />
          <PropertyRow label="Type" value={FIELD_TYPES[field.type]} />
          {field.placeholder && (
            <PropertyRow label="Placeholder" value={field.placeholder} />
          )}
          {field.helpText && (
            <PropertyRow label="Help Text" value={field.helpText} />
          )}
          {field.defaultValue !== undefined &&
            field.defaultValue !== "" &&
            !(Array.isArray(field.defaultValue) && field.defaultValue.length === 0) && (
              <PropertyRow
                label="Default Value"
                value={Array.isArray(field.defaultValue) ? field.defaultValue.join(", ") : String(field.defaultValue)}
              />
            )}
          {"options" in field && field.options && (
            <PropertyRow
              label="Options"
              value={field.options.map((o) => o.label).join(", ")}
            />
          )}
        </div>

        {/* Middle: Validation */}
        <div className="md:w-40 shrink-0 space-y-0.5">
          {hasValidation ? (
            <>
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                Validation
              </span>
              {field.required && (
                <p className="text-sm text-zinc-600">Required</p>
              )}
              {field.validation?.min != null && (
                <p className="text-sm text-zinc-600">
                  Min: {field.validation.min}
                </p>
              )}
              {field.validation?.max != null && (
                <p className="text-sm text-zinc-600">
                  Max: {field.validation.max}
                </p>
              )}
              {field.validation?.regex && (
                <p className="text-sm text-zinc-600 truncate" title={field.validation.regex}>
                  Regex: {field.validation.regex}
                </p>
              )}
              {field.validation?.custom && (
                <p className="text-sm text-zinc-600">
                  {CUSTOM_RULES[field.validation.custom]}
                </p>
              )}
              {field.validation?.dateRestriction && (
                <p className="text-sm text-zinc-600">
                  {field.validation.dateRestriction === "future" ? "Future dates only" : "Past dates only"}
                </p>
              )}
              {field.validation?.minDate && (
                <p className="text-sm text-zinc-600">
                  From: {field.validation.minDate}
                </p>
              )}
              {field.validation?.maxDate && (
                <p className="text-sm text-zinc-600">
                  Until: {field.validation.maxDate}
                </p>
              )}
              {field.conditionalVisibility && (
                <p className="text-sm text-zinc-500 italic">
                  {formatConditionSummary(field.conditionalVisibility)}
                </p>
              )}
            </>
          ) : (
            <span className="text-xs text-zinc-300">No validation</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 shrink-0">
        <Button variant="secondary" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm leading-snug">
      <span className="text-zinc-400 shrink-0 w-24">{label}</span>
      <span className="text-zinc-700 truncate">{value}</span>
    </div>
  );
}
