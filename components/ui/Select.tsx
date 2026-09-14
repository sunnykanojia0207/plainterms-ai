import type { SelectHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

interface Option {
  readonly value: string;
  readonly label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label: string;
  readonly options: readonly Option[];
  readonly error?: string;
}

/** Native select — accessible by default, styled to the token system. */
export function Select({ label, options, error, id, className, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative w-full max-w-full">
        <select
          id={selectId}
          aria-invalid={error !== undefined}
          aria-describedby={error === undefined ? undefined : errorId}
          className={cn(
            "h-11 w-full max-w-full cursor-pointer appearance-none rounded-md border border-border bg-surface pr-10 pl-3 text-base text-primary shadow-sm transition-colors hover:border-secondary focus:border-focus disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
            error !== undefined && "border-critical",
            className,
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface text-primary">
              {option.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-secondary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="m4 6 4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {error === undefined ? null : (
        <p id={errorId} role="alert" className="text-sm text-critical">
          {error}
        </p>
      )}
    </div>
  );
}
