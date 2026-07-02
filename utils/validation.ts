import { z } from "zod";
import type { FormField } from "@/types/form-schema";

function applyStringValidation(
  schema: z.ZodString,
  field: FormField,
): z.ZodString {
  let s = schema;
  if (field.validation?.min != null) {
    s = s.min(field.validation.min, `Must be at least ${field.validation.min} characters`);
  }
  if (field.validation?.max != null) {
    s = s.max(field.validation.max, `Must be at most ${field.validation.max} characters`);
  }
  if (field.validation?.regex) {
    try {
      s = s.regex(new RegExp(field.validation.regex), "Invalid format");
    } catch {
      // invalid regex — skip rather than crash
    }
  }
  if (field.validation?.custom === "email") {
    s = s.email("Invalid email address");
  }
  if (field.validation?.custom === "url") {
    s = s.url("Invalid URL");
  }
  if (field.validation?.custom === "lettersOnly") {
    s = s.regex(/^[a-zA-Z\s]*$/, "Only letters allowed");
  }
  return s;
}

function buildFieldSchema(field: FormField): z.ZodType {
  switch (field.type) {
    case "text":
    case "textarea": {
      let s = z.string();
      s = applyStringValidation(s, field);
      if (field.required) {
        s = s.min(1, `${field.label} is required`);
      }
      return field.required ? s : s.or(z.literal(""));
    }
    case "date": {
      let s = z.string();
      if (field.required) {
        s = s.min(1, `${field.label} is required`);
      }
      const base = field.required ? s : s.or(z.literal(""));
      const { minDate, maxDate, dateRestriction } = field.validation ?? {};
      if (minDate || maxDate || dateRestriction) {
        return base.check(
          z.refine((val) => {
            if (!val) return true;
            const today = new Date().toISOString().slice(0, 10);
            const effectiveMin = dateRestriction === "future" ? (minDate && minDate > today ? minDate : today) : minDate;
            const effectiveMax = dateRestriction === "past" ? (maxDate && maxDate < today ? maxDate : today) : maxDate;
            if (effectiveMin && val < effectiveMin) return false;
            if (effectiveMax && val > effectiveMax) return false;
            return true;
          }, {
            message: dateRestriction === "future"
              ? "Date must be today or later"
              : dateRestriction === "past"
                ? "Date must be today or earlier"
                : minDate && maxDate
                  ? `Date must be between ${minDate} and ${maxDate}`
                  : minDate
                    ? `Date must be ${minDate} or later`
                    : `Date must be ${maxDate} or earlier`,
          }),
        );
      }
      return base;
    }
    case "number": {
      let n = z.number({ message: "Must be a number" });
      if (field.validation?.min != null) {
        n = n.min(field.validation.min, `Must be at least ${field.validation.min}`);
      }
      if (field.validation?.max != null) {
        n = n.max(field.validation.max, `Must be at most ${field.validation.max}`);
      }
      if (field.required) return n;
      return n.optional();
    }
    case "checkbox": {
      const arr = z.array(z.string());
      if (field.required) {
        return arr.min(1, `${field.label} is required`);
      }
      return arr;
    }
    case "select":
    case "radio": {
      let s = z.string();
      if (field.required) {
        s = s.min(1, `${field.label} is required`);
      }
      return field.required ? s : s.optional();
    }
    default:
      return z.string();
  }
}

export function isFieldVisible(
  field: FormField,
  values: Record<string, unknown>,
): boolean {
  const cv = field.conditionalVisibility;
  if (!cv) return true;

  const fieldValue = values[cv.fieldName];

  switch (cv.conditionType) {
    case "text": {
      const str = String(fieldValue ?? "");
      const results = cv.rules.map((rule) => {
        if (rule.operator === "equals") return str === rule.value;
        return str.includes(rule.value);
      });
      return cv.logic === "and"
        ? results.every(Boolean)
        : results.some(Boolean);
    }
    case "number": {
      const num = Number(fieldValue);
      if (Number.isNaN(num)) return false;
      const results = cv.rules.map((rule) => {
        switch (rule.operator) {
          case "eq": return num === rule.value;
          case "lt": return num < rule.value;
          case "gt": return num > rule.value;
          case "lte": return num <= rule.value;
          case "gte": return num >= rule.value;
        }
      });
      return cv.logic === "and"
        ? results.every(Boolean)
        : results.some(Boolean);
    }
    case "choice": {
      if (cv.values.length === 0) return false;
      if (Array.isArray(fieldValue)) {
        const matches = cv.values.filter((v) => fieldValue.includes(v));
        return cv.logic === "and"
          ? matches.length === cv.values.length
          : matches.length > 0;
      }
      return cv.values.includes(String(fieldValue ?? ""));
    }
    case "date": {
      const dateStr = String(fieldValue ?? "");
      if (!dateStr) return false;
      if (cv.start && dateStr < cv.start) return false;
      if (cv.end && dateStr > cv.end) return false;
      return !!(cv.start || cv.end);
    }
  }
}

function buildPermissiveSchema(field: FormField): z.ZodType {
  switch (field.type) {
    case "checkbox":
      return z.array(z.string()).default([]);
    case "number":
      return z.number().optional();
    default:
      return z.string().optional().or(z.literal(""));
  }
}

export function buildZodSchema(
  fields: FormField[],
  currentValues?: Record<string, unknown>,
) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) {
    if (!field.name) continue;
    if (currentValues && !isFieldVisible(field, currentValues)) {
      shape[field.name] = buildPermissiveSchema(field);
    } else {
      shape[field.name] = buildFieldSchema(field);
    }
  }
  return z.object(shape);
}

export function getDefaultValues(fields: FormField[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue;
    } else {
      switch (field.type) {
        case "checkbox":
          defaults[field.name] = [];
          break;
        case "number":
          defaults[field.name] = undefined;
          break;
        default:
          defaults[field.name] = "";
      }
    }
  }
  return defaults;
}
