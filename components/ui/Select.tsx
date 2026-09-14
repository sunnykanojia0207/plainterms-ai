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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : errorId}
        className={cn(
          "h-11 rounded-md border border-border bg-surface px-3 text-base",
          error !== undefined && "border-critical",
          className,
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error === undefined ? null : (
        <p id={errorId} role="alert" className="text-sm text-critical">
          {error}
        </p>
      )}
    </div>
  );
}
