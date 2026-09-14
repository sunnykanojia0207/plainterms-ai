import type { ReactNode } from "react";
import { SEVERITY_META } from "@/lib/domain/vocabulary";
import type { SeverityLevel } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "accent" | "ai" | "success" | "warning" | "concern" | "critical";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-muted text-secondary",
  accent: "bg-accent-muted text-accent",
  ai: "bg-ai-muted text-ai-accent",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  concern: "bg-concern-muted text-concern",
  critical: "bg-critical-muted text-critical",
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
        tone === "neutral" && "bg-tertiary",
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
