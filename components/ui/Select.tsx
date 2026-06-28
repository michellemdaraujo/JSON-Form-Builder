"use client";

import { useId } from "react";

type SelectProps = {
  label: React.ReactNode;
  hideLabel?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<"select">, "className">;

export function Select({
  label,
  hideLabel,
  error,
  className,
  children,
  id: externalId,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={
          hideLabel
            ? "sr-only"
            : "block text-sm font-medium text-zinc-600 mb-1"
        }
      >
        {label}
      </label>
      <select
        id={id}
        className={`block w-full border rounded-md px-2 py-1.5 text-sm text-zinc-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
          error ? "border-red-400" : "border-zinc-300"
        }`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
