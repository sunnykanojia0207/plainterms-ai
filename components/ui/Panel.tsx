import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PanelProps {
  readonly title: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Titled region container for workspace panels (findings, obligations, dates…). */
export function Panel({ title, actions, children, className }: PanelProps) {
  return (
    <section aria-label={title} className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-secondary uppercase">{title}</h2>
        {actions}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
