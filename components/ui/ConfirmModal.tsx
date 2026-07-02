"use client";

import { useEffect } from "react";
import { Button } from "./Button";
import { useFocusTrap } from "@/hooks/use-focus-trap";

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  variant = "default",
  onConfirm,
  onCancel,
}: Props) {
  const trapRef = useFocusTrap<HTMLDivElement>();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onCancel} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
          <p className="mt-2 text-sm text-zinc-600">{message}</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className={
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : undefined
              }
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
