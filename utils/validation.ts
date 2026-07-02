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
    case "textarea":
    case "date": {
      let s = z.string();
      s = applyStringValidation(s, field);
      if (field.required) {
        s = s.min(1, `${field.label} is required`);
      }
      return field.required ? s : s.or(z.literal(""));
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

function isFieldVisible(
  field: FormField,
  values: Record<string, unknown>,
): boolean {
  if (!field.conditionalVisibility) return true;
  const { fieldName, value } = field.conditionalVisibility;
  return String(values[fieldName] ?? "") === String(value);
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
