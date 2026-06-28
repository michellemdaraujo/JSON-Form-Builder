"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FormSchema, FormField } from "@/types/form-schema";
import { buildZodSchema, getDefaultValues } from "@/utils/validation";
import { mockSubmit, type SubmitResult } from "@/utils/mock-submit";
import { TextField } from "./ui/TextField";
import { Select } from "./ui/Select";
import { Checkbox } from "./ui/Checkbox";
import { Button } from "./ui/Button";

type Props = {
  schema: FormSchema;
};

export function FormPreview({ schema }: Props) {
  const { fields } = schema;

  const zodSchema = useMemo(() => buildZodSchema(fields), [fields]);
  const defaultValues = useMemo(() => getDefaultValues(fields), [fields]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watchedValues = watch();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const onSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true);
    setResult(null);
    const res = await mockSubmit(data);
    setResult(res);
    setSubmitting(false);
  };

  const isVisible = (field: FormField) => {
    if (!field.conditionalVisibility) return true;
    const { fieldName, value } = field.conditionalVisibility;
    return String(watchedValues[fieldName] ?? "") === String(value);
  };

  return (
    <div className="p-4 border-b border-zinc-200">
      <h2 className="text-sm font-semibold text-zinc-700 mb-3">
        Live Preview: {schema.title}
      </h2>

      {fields.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Add fields to see the form preview.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {fields.map((field) => {
            if (!field.name || !isVisible(field)) return null;
            return (
              <PreviewField
                key={field.id}
                field={field}
                register={register}
                error={errors[field.name]?.message as string | undefined}
              />
            );
          })}

          {result && (
            <div
              className={`text-sm p-2 rounded ${
                result.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.message}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                reset(defaultValues);
                setResult(null);
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function PreviewField({
  field,
  register,
  error,
}: {
  field: FormField;
  register: ReturnType<typeof useForm>["register"];
  error?: string;
}) {
  const fieldLabel = (
    <>
      {field.label}
      {field.required && <span className="text-red-500 ml-0.5">*</span>}
    </>
  );

  if (field.type === "textarea") {
    const reg = register(field.name);
    const textareaId = `preview-${field.id}`;
    return (
      <div>
        <label htmlFor={textareaId} className="block text-sm font-medium text-zinc-600 mb-1">
          {fieldLabel}
        </label>
        <textarea
          id={textareaId}
          {...reg}
          placeholder={field.placeholder}
          rows={3}
          className="block w-full border border-zinc-300 rounded-md px-2 py-1.5 text-sm text-zinc-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {field.helpText && (
          <p className="text-xs text-zinc-400 mt-0.5">{field.helpText}</p>
        )}
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    );
  }

  if (field.type === "select") {
    const reg = register(field.name);
    return (
      <Select label={fieldLabel} error={error} {...reg}>
        <option value="">Select...</option>
        {"options" in field &&
          field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </Select>
    );
  }

  if (field.type === "radio") {
    return (
      <div>
        <span className="block text-sm font-medium text-zinc-600 mb-1">
          {fieldLabel}
        </span>
        <div className="flex flex-wrap gap-3">
          {"options" in field &&
            field.options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-1.5 text-sm text-zinc-700"
              >
                <input
                  type="radio"
                  value={opt.value}
                  {...register(field.name)}
                  className="accent-blue-600"
                />
                {opt.label}
              </label>
            ))}
        </div>
        {field.helpText && (
          <p className="text-xs text-zinc-400 mt-0.5">{field.helpText}</p>
        )}
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    );
  }

  if (field.type === "checkbox") {
    const options = "options" in field ? field.options : [];
    if (options.length === 1) {
      return (
        <div>
          <Checkbox
            label={options[0].label}
            value={options[0].value}
            {...register(field.name)}
          />
          {field.helpText && (
            <p className="text-xs text-zinc-400 mt-0.5">{field.helpText}</p>
          )}
          {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>
      );
    }
    return (
      <div>
        <span className="block text-sm font-medium text-zinc-600 mb-1">
          {fieldLabel}
        </span>
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-1.5 text-sm text-zinc-700"
            >
              <input
                type="checkbox"
                value={opt.value}
                {...register(field.name)}
                className="accent-blue-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {field.helpText && (
          <p className="text-xs text-zinc-400 mt-0.5">{field.helpText}</p>
        )}
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    );
  }

  const reg =
    field.type === "number"
      ? register(field.name, { setValueAs: (v: string) => v === "" ? undefined : Number(v) })
      : register(field.name);

  return (
    <TextField
      label={fieldLabel}
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      placeholder={field.placeholder}
      helpText={field.helpText}
      error={error}
      {...reg}
    />
  );
}
