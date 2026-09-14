import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name. Required — icon buttons have no visible text. */
  readonly label: string;
  readonly children: ReactNode;
}

/** Icon-only button. `label` is announced to screen readers and shown as a tooltip. */
export function IconButton({ label, children, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-md",
        "text-secondary transition-colors hover:bg-surface-muted hover:text-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
