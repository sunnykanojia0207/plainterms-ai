import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface NoticeProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly action?: ReactNode;
  readonly className?: string;
}

/**
 * System notice: title, detail, and recovery action on a quiet marker —
 * not a card. Cards are reserved for content; notices must never compete
 * with it.
 */
export function Notice({ title, children, action, className }: NoticeProps) {
  return (
    <div className={cn("flex gap-3 px-1 py-2", className)}>
      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-tertiary" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-base font-medium">{title}</p>
        <div className="text-sm text-secondary">{children}</div>
        {action === undefined ? null : <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
