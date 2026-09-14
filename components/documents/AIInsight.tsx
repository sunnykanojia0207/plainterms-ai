import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface AIInsightProps {
  readonly marker: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/** AI voice block: violet 3px left rule, marker header, slotted body. */
export function AIInsight({ marker, children, className }: AIInsightProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border border-l-[3px] border-l-ai-accent bg-ai-muted p-3",
        className,
      )}
    >
      <p className="text-xs font-medium tracking-wide text-ai-accent uppercase">{marker}</p>
      <div className="mt-1 text-[15px] leading-6">{children}</div>
    </div>
  );
}
