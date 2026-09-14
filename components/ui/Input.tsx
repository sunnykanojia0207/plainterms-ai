import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly error?: string;
  readonly hint?: string;
}

/** Labeled text input with hint and error messaging. Label always visible. */
export function Input({ label, error, hint, id, className, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [hint === undefined ? null : hintId, error === undefined ? null : errorId]
      .filter((part) => part !== null)
      .join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 rounded-md border border-border bg-surface px-3 text-base",
          "placeholder:text-secondary",
          error !== undefined && "border-critical",
          className,
        )}
        {...rest}
      />
      {hint === undefined || error !== undefined ? null : (
        <p id={hintId} className="text-sm text-secondary">
          {hint}
        </p>
      )}
      {error === undefined ? null : (
        <p id={errorId} role="alert" className="text-sm text-critical">
          {error}
        </p>
      )}
    </div>
  );
}
