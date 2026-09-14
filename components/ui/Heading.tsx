import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Level = 1 | 2 | 3;

const LEVEL_TAGS = { 1: "h1", 2: "h2", 3: "h3" } as const;
const LEVEL_CLASSES: Record<Level, string> = {
  1: "text-display font-semibold tracking-tight",
  2: "text-h2 font-semibold tracking-tight",
  3: "text-lg leading-7 font-semibold",
};

interface HeadingProps {
  readonly level?: Level;
  readonly id?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Editorial headings. Level maps to a real heading element. */
export function Heading({ level = 1, id, className, children }: HeadingProps) {
  const Tag = LEVEL_TAGS[level];
  return (
    <Tag id={id} className={cn(LEVEL_CLASSES[level], className)}>
      {children}
    </Tag>
  );
}
