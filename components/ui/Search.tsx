"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

interface SearchProps {
  readonly label: string;
  readonly placeholder?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly matchCount?: number;
  readonly className?: string;
}

/** In-document style search field with match count and keyboard hint. */
export function Search({
  label,
  placeholder,
  value,
  onChange,
  matchCount,
  className,
}: SearchProps) {
  const inputId = useId();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative flex-1">
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-3 -translate-y-1/2 text-text-secondary"
        >
          ⌕
        </span>
        <input
          id={inputId}
          type="search"
          role="searchbox"
          placeholder={placeholder ?? "Search"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-md border border-border bg-surface pr-16 pl-9 text-sm placeholder:text-text-secondary"
        />
        {matchCount === undefined ? null : (
          <span
            aria-live="polite"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-text-secondary"
          >
            {matchCount} {matchCount === 1 ? "match" : "matches"}
          </span>
        )}
      </div>
    </div>
  );
}
