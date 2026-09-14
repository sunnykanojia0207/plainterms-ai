import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly labelledBy?: string;
}

/** Border-flat surface card. No heavy shadows; hierarchy comes from borders. */
export function Card({ children, className, labelledBy }: CardProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn("rounded-lg border border-border bg-surface p-4 sm:p-6", className)}
    >
      {children}
    </section>
  );
}
