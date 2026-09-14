import type { ReactNode } from "react";
import { SEVERITY_META } from "@/lib/domain/vocabulary";
import type { SeverityLevel } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "accent" | "ai" | "success" | "warning" | "concern" | "critical";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-neutral-bg text-text-secondary",
  accent: "bg-accent/10 text-accent",
  ai: "bg-ai-bg text-ai",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  concern: "bg-concern-bg text-concern",
  critical: "bg-critical-bg text-critical",
};

const SEVERITY_TONE: Record<SeverityLevel, Tone> = {
  neutral: "neutral",
  obligation: "accent",
  "worth-reviewing": "warning",
  "potential-concern": "concern",
  critical: "critical",
};

interface BadgeProps {
  readonly tone?: Tone;
  readonly icon?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Small labeled pill. Meaning always comes from text, never color alone. */
export function Badge({ tone = "neutral", icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon === undefined ? null : (
        <span aria-hidden="true" className="inline-flex">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

interface SeverityTagProps {
  readonly severity: SeverityLevel;
  readonly className?: string;
}

/** Severity badge driven by the standard vocabulary. Icon + word, always. */
export function SeverityTag({ severity, className }: SeverityTagProps) {
  const meta = SEVERITY_META[severity];
  return (
    <Badge tone={SEVERITY_TONE[severity]} className={className}>
      <Dot tone={SEVERITY_TONE[severity]} />
      {meta.label}
    </Badge>
  );
}

function Dot({ tone }: { readonly tone: Tone }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-1.5 rounded-full",
        tone === "neutral" && "bg-neutral",
        tone === "accent" && "bg-accent",
        tone === "ai" && "bg-ai",
        tone === "success" && "bg-success",
        tone === "warning" && "bg-warning",
        tone === "concern" && "bg-concern",
        tone === "critical" && "bg-critical",
      )}
    />
  );
}
