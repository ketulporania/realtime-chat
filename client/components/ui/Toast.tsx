"use client";

import { useEffect } from "react";

export type ToastVariant = "error" | "warning" | "info";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onDismiss: () => void;
  autoDismissMs?: number;
}

const variantStyles: Record<ToastVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-white text-slate-800",
};

const variantIcons: Record<ToastVariant, string> = {
  error: "⚠",
  warning: "⚡",
  info: "ℹ",
};

export function Toast({
  message,
  variant = "error",
  onDismiss,
  autoDismissMs = 6000,
}: ToastProps) {
  useEffect(() => {
    if (autoDismissMs <= 0) return;
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [message, autoDismissMs, onDismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        className={`animate-slide-up pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${variantStyles[variant]}`}
        role="alert"
      >
        <span className="mt-0.5 text-base" aria-hidden>
          {variantIcons[variant]}
        </span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md px-1.5 py-0.5 text-xs opacity-70 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
