import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ReviewSectionProps {
  readonly title: string;
  readonly count?: number;
  /** Accessible name for the section (region). */
  readonly label?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Caption heading + optional count + slotted body. */
export function ReviewSection({ title, count, label, children, className }: ReviewSectionProps) {
  return (
    <section aria-label={label} className={cn("flex flex-col gap-3", className)}>
      <h3 className="border-b border-border-subtle pb-1.5 text-xs font-semibold tracking-wider text-secondary uppercase">
        {title}
        {count === undefined ? null : <span className="ml-1 tabular-nums">({count})</span>}
      </h3>
      {children}
    </section>
  );
}
