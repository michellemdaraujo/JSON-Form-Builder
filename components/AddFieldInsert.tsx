"use client";

import { useState } from "react";
import { FIELD_TYPES, type FieldType } from "@/types/form-schema";
import { Button } from "./ui/Button";

type Props = {
  onAdd: (type: FieldType) => void;
};

export function AddFieldInsert({ onAdd }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="flex-1 border-t border-dashed border-zinc-300" />
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-zinc-400 hover:text-zinc-600 whitespace-nowrap cursor-pointer"
        >
          + Add field
        </button>
        <div className="flex-1 border-t border-dashed border-zinc-300" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2 justify-center flex-wrap bg-zinc-50 rounded-lg border border-dashed border-zinc-300 px-3">
      {(Object.keys(FIELD_TYPES) as FieldType[]).map((type) => (
        <Button
          key={type}
          variant="secondary"
          size="sm"
          onClick={() => {
            onAdd(type);
            setOpen(false);
          }}
        >
          {FIELD_TYPES[type]}
        </Button>
      ))}
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => setOpen(false)}
        className="text-zinc-400"
      >
        ✕
      </Button>
    </div>
  );
}
