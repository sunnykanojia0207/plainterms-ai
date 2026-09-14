"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface ToastAction {
  readonly label: string;
  readonly onSelect: () => void;
}

interface ToastItem {
  readonly id: number;
  readonly message: string;
  readonly action?: ToastAction;
}

interface ToastContextValue {
  notify: (message: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (value === null) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return value;
}

/** Toast system. Polite live region; auto-dismisses; supports one action (e.g. Undo). */
export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, action?: ToastAction) => {
      const id = nextId.current;
      nextId.current += 1;
      const item: ToastItem = action === undefined ? { id, message } : { id, message, action };
      setToasts((current) => [...current, item]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 left-1/2 z-60 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-center justify-between gap-3",
              "rounded-lg border border-border bg-surface-raised px-4 py-3 shadow-md",
            )}
          >
            <p className="text-sm">{toast.message}</p>
            <div className="flex shrink-0 items-center gap-2">
              {toast.action === undefined ? null : (
                <button
                  type="button"
                  className="text-sm font-medium text-accent"
                  onClick={() => {
                    toast.action?.onSelect();
                    dismiss(toast.id);
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Dismiss notification"
                className="text-sm text-secondary hover:text-primary"
                onClick={() => dismiss(toast.id)}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
