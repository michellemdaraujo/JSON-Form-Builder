"use client";

import { useState, useEffect, useMemo } from "react";
import type { FormField } from "@/types/form-schema";
import { FieldEditor } from "./FieldEditor";
import { Button } from "./ui/Button";

type Props = {
  mode: "create" | "edit";
  initialField: FormField;
  allFields: FormField[];
  onSave: (field: FormField) => void;
  onClose: () => void;
};

function validateDraft(
  draft: FormField,
  allFields: FormField[],
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!draft.label.trim()) {
    errors.label = "Label is required";
  }

  if (!draft.name.trim()) {
    errors.name = "Name is required";
  } else if (allFields.some((f) => f.id !== draft.id && f.name === draft.name)) {
    errors.name = "Duplicate field name";
  }

  if (
    (draft.type === "select" || draft.type === "radio" || draft.type === "checkbox") &&
    "options" in draft
  ) {
    if (draft.options.length === 0) {
      errors.options = "At least one option is required";
    } else if (draft.options.some((o) => !o.label.trim() || !o.value.trim())) {
      errors.options = "All options must have a label and value";
    }
  }

  if (draft.validation?.regex) {
    try {
      new RegExp(draft.validation.regex);
    } catch {
      errors.validation = "Invalid regex pattern";
    }
  }

  if (draft.validation?.min != null && draft.validation?.max != null) {
    if (draft.validation.min > draft.validation.max) {
      errors.validation = "Min must be less than or equal to max";
    }
  }

  return errors;
}

export function EditorSidebar({
  mode,
  initialField,
  allFields,
  onSave,
  onClose,
}: Props) {
  const [draft, setDraft] = useState<FormField>(initialField);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleUpdate = (updates: Partial<FormField>) => {
    setDraft((prev) => ({ ...prev, ...updates }) as FormField);
  };

  const errors = useMemo(() => validateDraft(draft, allFields), [draft, allFields]);
  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = () => {
    setSubmitted(true);
    if (!isValid) return;
    onSave(draft);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      <div className="fixed left-0 top-0 h-full w-full md:w-105 bg-white shadow-xl z-50 flex flex-col border-r border-zinc-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 shrink-0">
          <h2 className="text-base font-semibold text-zinc-800">
            {mode === "create" ? "Add Field" : "Edit Field"}
          </h2>
          <Button variant="tertiary" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <FieldEditor
            field={draft}
            allFields={allFields}
            errors={submitted ? errors : {}}
            onUpdate={handleUpdate}
          />
        </div>

        <div className="border-t border-zinc-200 px-5 py-3 flex justify-end gap-2 shrink-0">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {mode === "create" ? "Add Field" : "Save Changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
