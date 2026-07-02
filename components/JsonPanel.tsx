"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import { FIELD_TYPES, type FormSchema } from "@/types/form-schema";
import { Button } from "./ui/Button";

const validTypes = Object.keys(FIELD_TYPES) as [string, ...string[]];

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const validationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  regex: z.string().optional(),
  custom: z.enum(["email", "url", "lettersOnly"] as [string, ...string[]]).optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  dateRestriction: z.enum(["past", "future"]).optional(),
});

const textRuleSchema = z.object({
  operator: z.enum(["equals", "includes"]),
  value: z.string(),
});

const numberRuleSchema = z.object({
  operator: z.enum(["eq", "lt", "gt", "lte", "gte"]),
  value: z.number(),
});

const conditionalSchema = z.discriminatedUnion("conditionType", [
  z.object({
    fieldName: z.string(),
    logic: z.enum(["and", "or"]),
    conditionType: z.literal("text"),
    rules: z.array(textRuleSchema).min(1),
  }),
  z.object({
    fieldName: z.string(),
    logic: z.enum(["and", "or"]),
    conditionType: z.literal("number"),
    rules: z.array(numberRuleSchema).min(1),
  }),
  z.object({
    fieldName: z.string(),
    logic: z.enum(["and", "or"]),
    conditionType: z.literal("choice"),
    values: z.array(z.string()),
  }),
  z.object({
    fieldName: z.string(),
    logic: z.enum(["and", "or"]),
    conditionType: z.literal("date"),
    start: z.string().optional(),
    end: z.string().optional(),
  }),
]);

const fieldSchema = z.object({
  id: z.string().min(1, "Field 'id' is required"),
  name: z.string().min(1, "Field 'name' is required"),
  label: z.string(),
  type: z.enum(validTypes, { message: `Invalid type. Must be one of: ${validTypes.join(", ")}` }),
  required: z.boolean(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  options: z.array(optionSchema).optional(),
  validation: validationSchema.optional(),
  conditionalVisibility: conditionalSchema.optional(),
});

const importSchema = z
  .object({
    version: z.number(),
    title: z.string(),
    fields: z.array(fieldSchema),
  })
  .superRefine((data, ctx) => {
    const names = new Set<string>();
    const ids = new Set<string>();
    for (let i = 0; i < data.fields.length; i++) {
      const { id, name } = data.fields[i];
      if (ids.has(id)) {
        ctx.addIssue(`Duplicate field id '${id}' at index ${i}`);
      }
      ids.add(id);
      if (name && names.has(name)) {
        ctx.addIssue(`Duplicate field name '${name}' at index ${i}`);
      }
      if (name) names.add(name);
    }
  });

type Props = {
  schema: FormSchema;
  onImport: (schema: FormSchema) => void;
};

export function JsonPanel({ schema, onImport }: Props) {
  const [json, setJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const exportJson = JSON.stringify(schema, null, 2);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseAndImport = (text: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON.");
      return;
    }

    const result = importSchema.safeParse(parsed);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      setError(firstIssue.message);
      return;
    }

    onImport(result.data as FormSchema);
    setJson("");
    setError(null);
    setShowImport(false);
  };

  const handleImport = () => parseAndImport(json);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setJson(text);
      parseAndImport(text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportJson);
  };

  const handleDownload = () => {
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${schema.title || "form-schema"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="text-sm font-semibold text-zinc-700 shrink-0">JSON Schema</h2>
        <div className="flex gap-1 flex-wrap justify-end">
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            Copy
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            Download
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowImport(!showImport)}
          >
            {showImport ? "Cancel" : "Import"}
          </Button>
        </div>
      </div>

      {showImport ? (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <label htmlFor="json-import" className="sr-only">JSON schema input</label>
          <textarea
            id="json-import"
            value={json}
            onChange={(e) => {
              setJson(e.target.value);
              setError(null);
            }}
            placeholder="Paste JSON schema here..."
            className="flex-1 block w-full border border-zinc-300 rounded-md px-2 py-1.5 text-xs text-zinc-800 bg-white font-mono min-h-30 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleImport}>
              Import Schema
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <pre className="flex-1 bg-zinc-50 border border-zinc-200 rounded p-2 text-xs font-mono overflow-auto text-zinc-700 min-h-30 whitespace-pre-wrap wrap-break-word">
          {exportJson}
        </pre>
      )}
    </div>
  );
}
