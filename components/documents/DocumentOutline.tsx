"use client";

import { cn } from "@/lib/utils/cn";
import type { FixtureSection } from "@/lib/documents/fixture";

interface DocumentOutlineProps {
  readonly sections: readonly FixtureSection[];
  readonly activeId: string | null;
  readonly onSelect: (sectionId: string) => void;
  readonly label?: string;
}

/** Section navigation: outline list with a current-section indicator. */
export function DocumentOutline({
  sections,
  activeId,
  onSelect,
  label = "Document sections",
}: DocumentOutlineProps) {
  return (
    <nav aria-label={label} className="flex flex-col gap-0.5">
      <h2 className="px-2 pb-2 text-sm font-semibold tracking-wide text-secondary uppercase">
        Sections
      </h2>
      <ol className="flex flex-col gap-0.5">
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onSelect(section.id)}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  active
                    ? "bg-accent-muted font-medium text-accent"
                    : "text-secondary hover:bg-surface-muted hover:text-primary",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    active ? "bg-accent" : "bg-border",
                  )}
                />
                <span className="min-w-0 flex-1">{section.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
