"use client";

import { useId } from "react";

type CheckboxProps = {
  label: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<"input">, "type" | "className">;

export function Checkbox({
  label,
  className,
  id: externalId,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;

  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-2 text-sm text-zinc-700 ${className ?? ""}`}
    >
      <input
        id={id}
        type="checkbox"
        className="rounded border-zinc-300 accent-blue-600"
        {...props}
      />
      {label}
    </label>
  );
}
