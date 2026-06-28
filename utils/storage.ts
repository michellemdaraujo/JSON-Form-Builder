import type { FormSchema } from "@/types/form-schema";

const STORAGE_KEY = "json-form-builder-schema";

export function saveSchema(schema: FormSchema): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
}

export function loadSchema(): FormSchema | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FormSchema;
  } catch {
    return null;
  }
}

export function clearSchema(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
