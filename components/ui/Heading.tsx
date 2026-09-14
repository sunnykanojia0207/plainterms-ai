import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Level = 1 | 2 | 3;

const LEVEL_TAGS = { 1: "h1", 2: "h2", 3: "h3" } as const;
const LEVEL_CLASSES: Record<Level, string> = {
  1: "text-page-title font-semibold tracking-tight text-balance",
  2: "text-h2 font-semibold tracking-tight text-balance",
  3: "text-[15px] leading-[22px] font-semibold",
};

const DISPLAY_CLASS =
  "text-[1.75rem] leading-[2.125rem] font-semibold tracking-tight text-balance sm:text-display";

interface HeadingProps {
  readonly level?: Level;
  /** Display variant is reserved for the Home hero. App pages use the compact page title. */
  readonly variant?: "page" | "display";
  readonly id?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Editorial headings. Level maps to a real heading element. */
export function Heading({ level = 1, variant = "page", id, className, children }: HeadingProps) {
  const Tag = LEVEL_TAGS[level];
  const base = level === 1 && variant === "display" ? DISPLAY_CLASS : LEVEL_CLASSES[level];
  return (
    <Tag id={id} className={cn(base, className)}>
      {children}
    </Tag>
  );
}
