import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SurfaceProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/** Border-flat surface base. No shadow; hierarchy comes from borders. */
export function Surface({ children, className }: SurfaceProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface", className)}>{children}</div>
  );
}
