"use client";

import { useId } from "react";
import type { ReactNode } from "react";

interface TooltipProps {
  readonly label: string;
  readonly children: ReactNode;
}

/**
 * Accessible tooltip: appears on hover AND keyboard focus via
 * group-focus-visible, announced through aria-describedby.
 * For essential meaning, use visible text instead.
 */
export function Tooltip({ label, children }: TooltipProps) {
  const tooltipId = useId();
  return (
    <span className="group/tooltip relative inline-flex" aria-describedby={tooltipId}>
      {children}
      <span
        role="tooltip"
        id={tooltipId}
        className="pointer-events-none absolute bottom-full left-1/2 z-70 mb-2 hidden -translate-x-1/2 rounded-md bg-text-primary px-2 py-1 text-xs whitespace-nowrap text-bg group-hover/tooltip:block group-focus-within/tooltip:block"
      >
        {label}
      </span>
    </span>
  );
}
