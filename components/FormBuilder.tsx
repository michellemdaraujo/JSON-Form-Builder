"use client";

import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormSchema, FormField, FieldType } from "@/types/form-schema";
import { DEFAULT_SCHEMA } from "@/utils/default-schema";
import { saveSchema, loadSchema, clearSchema } from "@/utils/storage";
import { TextField } from "./ui/TextField";
import { Checkbox } from "./ui/Checkbox";
import { Button } from "./ui/Button";
import { FieldCard } from "./FieldCard";
import { AddFieldInsert } from "./AddFieldInsert";
import { EditorSidebar } from "./EditorSidebar";
import { ConfirmModal } from "./ui/ConfirmModal";
import { FormPreview } from "./FormPreview";
import { JsonPanel } from "./JsonPanel";

type ConfirmAction =
  | { type: "delete"; fieldId: string; fieldLabel: string }
  | { type: "load" }
  | { type: "reset" };

type SidebarState =
  | { mode: "create"; draft: FormField; insertIndex: number }
  | { mode: "edit"; fieldId: string };

let nextId = 100;
function generateId() {
  return `field-${Date.now()}-${nextId++}`;
}

function createField(type: FieldType): FormField {
  const base = {
    id: generateId(),
    label: "",
    name: "",
    placeholder: "",
    helpText: "",
    required: false,
  };

  switch (type) {
    case "select":
    case "radio":
      return {
        ...base,
        type,
        options: [{ label: "Option 1", value: "option1" }],
      };
    case "checkbox":
      return {
        ...base,
        type,
        options: [{ label: "Option 1", value: "option1" }],
      };
    case "number":
      return { ...base, type };
    default:
      return { ...base, type };
  }
}

export function FormBuilder() {
  const [schema, setSchema] = useState<FormSchema>(() => loadSchema() ?? DEFAULT_SCHEMA);
  const [sidebar, setSidebar] = useState<SidebarState | null>(null);
  const [storageMsg, setStorageMsg] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [autoSave, setAutoSave] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("json-form-builder-autosave") === "true";
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function flash(msg: string) {
    setStorageMsg(msg);
    setTimeout(() => setStorageMsg(null), 2000);
  }

  const debouncedAutoSave = useCallback(
    (schemaToSave: FormSchema) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveSchema(schemaToSave);
        flash("Saved!");
      }, 500);
    },
    [],
  );

  const updateFields = useCallback(
    (updater: (fields: FormField[]) => FormField[]) => {
      setSchema((prev) => ({ ...prev, fields: updater(prev.fields) }));
    },
    [],
  );

  const openAddField = useCallback((type: FieldType, index: number) => {
    const field = createField(type);
    setSidebar({ mode: "create", draft: field, insertIndex: index });
  }, []);

  const removeField = useCallback(
    (id: string) => {
      updateFields((fields) => fields.filter((f) => f.id !== id));
      setSidebar((prev) => {
        if (prev?.mode === "edit" && prev.fieldId === id) return null;
        return prev;
      });
    },
    [updateFields],
  );

  const handleSidebarSave = useCallback(
    (field: FormField) => {
      if (!sidebar) return;
      setSchema((prev) => {
        let nextFields: FormField[];
        if (sidebar.mode === "create") {
          nextFields = [...prev.fields];
          nextFields.splice(sidebar.insertIndex, 0, field);
        } else {
          nextFields = prev.fields.map((f) => (f.id === field.id ? field : f));
        }
        const next = { ...prev, fields: nextFields };
        if (autoSave) debouncedAutoSave(next);
        return next;
      });
      setSidebar(null);
    },
    [sidebar, autoSave, debouncedAutoSave],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setSchema((prev) => {
          const oldIndex = prev.fields.findIndex((f) => f.id === active.id);
          const newIndex = prev.fields.findIndex((f) => f.id === over.id);
          const next = { ...prev, fields: arrayMove(prev.fields, oldIndex, newIndex) };
          if (autoSave) debouncedAutoSave(next);
          return next;
        });
      }
    },
    [autoSave, debouncedAutoSave],
  );

  const toggleAutoSave = (enabled: boolean) => {
    setAutoSave(enabled);
    localStorage.setItem("json-form-builder-autosave", String(enabled));
    if (enabled) {
      saveSchema(schema);
      flash("Auto-save on");
    }
  };

  const handleSave = () => {
    saveSchema(schema);
    flash("Saved!");
  };

  const handleLoad = () => {
    const saved = loadSchema();
    if (saved) {
      setSchema(saved);
      setSidebar(null);
      flash("Loaded!");
    } else {
      flash("Nothing saved yet.");
    }
  };

  const handleReset = () => {
    clearSchema();
    setSchema(DEFAULT_SCHEMA);
    setSidebar(null);
    flash("Reset!");
  };

  const handleImport = (imported: FormSchema) => {
    setSchema(imported);
    setSidebar(null);
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    switch (confirmAction.type) {
      case "delete":
        removeField(confirmAction.fieldId);
        break;
      case "load":
        handleLoad();
        break;
      case "reset":
        handleReset();
        break;
    }
    setConfirmAction(null);
  };

  const sidebarField = sidebar
    ? sidebar.mode === "create"
      ? sidebar.draft
      : schema.fields.find((f) => f.id === sidebar.fieldId) ?? null
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <h1 className="text-base md:text-lg font-semibold text-zinc-900 shrink-0">
            JSON Form Builder
          </h1>
          <TextField
            label="Form title"
            hideLabel
            value={schema.title}
            onChange={(e) =>
              setSchema((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          {storageMsg && (
            <span className="text-sm text-green-600 font-medium">
              {storageMsg}
            </span>
          )}
          <Button variant="tertiary" onClick={handleSave}>
            Save
          </Button>
          <Checkbox
            label="Auto-save"
            checked={autoSave}
            onChange={(e) => toggleAutoSave(e.target.checked)}
          />
          <Button
            variant="tertiary"
            onClick={() => setConfirmAction({ type: "load" })}
          >
            Load
          </Button>
          <Button
            variant="tertiary"
            onClick={() => setConfirmAction({ type: "reset" })}
            className="text-red-600 hover:text-red-700"
          >
            Reset
          </Button>
        </div>
      </header>

      {/* Three-column layout — stacks on small screens */}
      <div className="flex flex-col md:flex-row flex-1 overflow-auto md:overflow-hidden">
        {/* Left: Field cards */}
        <div className="md:flex-5 overflow-y-auto p-4 md:p-6 bg-zinc-100 min-w-0">
          {schema.fields.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-4">
              <p className="text-zinc-400">No fields yet.</p>
              <AddFieldInsert onAdd={(type) => openAddField(type, 0)} />
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={schema.fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  <AddFieldInsert onAdd={(type) => openAddField(type, 0)} />
                  {schema.fields.map((field, idx) => (
                    <div key={field.id}>
                      <SortableFieldCard
                        field={field}
                        onEdit={() =>
                          setSidebar({ mode: "edit", fieldId: field.id })
                        }
                        onDelete={() =>
                          setConfirmAction({
                            type: "delete",
                            fieldId: field.id,
                            fieldLabel: field.label,
                          })
                        }
                      />
                      <AddFieldInsert
                        onAdd={(type) => openAddField(type, idx + 1)}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Middle: Live preview */}
        <div className="md:flex-3 border-t md:border-t-0 md:border-l border-zinc-200 overflow-y-auto bg-white">
          <FormPreview schema={schema} />
        </div>

        {/* Right: JSON schema */}
        <div className="md:flex-2 border-t md:border-t-0 md:border-l border-zinc-200 overflow-y-auto bg-zinc-50 flex flex-col">
          <JsonPanel schema={schema} onImport={handleImport} />
        </div>
      </div>

      {/* Confirm modal */}
      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction.type === "delete"
              ? "Delete Field"
              : confirmAction.type === "load"
                ? "Load Schema"
                : "Reset Schema"
          }
          message={
            confirmAction.type === "delete"
              ? `Are you sure you want to delete "${confirmAction.fieldLabel}"? This cannot be undone.`
              : confirmAction.type === "load"
                ? "This will replace your current schema with the saved version. Unsaved changes will be lost."
                : "This will clear all saved data and restore the default schema. This cannot be undone."
          }
          confirmLabel={
            confirmAction.type === "delete"
              ? "Delete"
              : confirmAction.type === "load"
                ? "Load"
                : "Reset"
          }
          variant={confirmAction.type === "load" ? "default" : "danger"}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Editor sidebar (overlay) */}
      {sidebar && sidebarField && (
        <EditorSidebar
          key={sidebarField.id}
          mode={sidebar.mode}
          initialField={sidebarField}
          allFields={schema.fields}
          onSave={handleSidebarSave}
          onClose={() => setSidebar(null)}
        />
      )}
    </div>
  );
}

function SortableFieldCard({
  field,
  onEdit,
  onDelete,
}: {
  field: FormField;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FieldCard
        field={field}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

