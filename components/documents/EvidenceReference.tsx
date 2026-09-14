import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EvidenceReferenceProps {
  readonly quote: ReactNode;
  readonly location: string;
  readonly verifyHref?: string;
  /** Custom source action (e.g. Jump/Verify links with exact copy). Replaces the default Verify link. */
  readonly action?: ReactNode;
  /** "evidence" wash (default) or "plain" surface for version panes. */
  readonly variant?: "evidence" | "plain";
  readonly className?: string;
}

/** Quoted clause well + mono source location + optional source action. */
export function EvidenceReference({
  quote,
  location,
  verifyHref,
  action,
  variant = "evidence",
  className,
}: EvidenceReferenceProps) {
  return (
    <figure
      className={cn(
        "rounded-md border px-3 py-2",
        variant === "plain" ? "border-border bg-background" : "border-evidence-border bg-evidence",
        className,
      )}
    >
      <blockquote className="font-doc text-[15px]">{quote}</blockquote>
      <figcaption className="mt-1 flex flex-wrap items-center gap-2 font-evidence text-xs text-secondary tabular-nums">
        <span>{location}</span>
        {action ??
          (verifyHref === undefined ? null : (
            <a href={verifyHref} className="font-semibold text-accent">
              Verify
            </a>
          ))}
      </figcaption>
    </figure>
  );
}
