import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type TextTone = "primary" | "secondary" | "accent" | "critical";

const TONE_CLASSES: Record<TextTone, string> = {
  primary: "text-text-primary",
  secondary: "text-text-secondary",
  accent: "text-accent",
  critical: "text-critical",
};

interface TextProps {
  readonly tone?: TextTone;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Body text with constrained measure for readability. */
export function Text({ tone = "primary", className, children }: TextProps) {
  return (
    <p className={cn("max-w-[65ch] text-base leading-7", TONE_CLASSES[tone], className)}>
      {children}
    </p>
  );
}
