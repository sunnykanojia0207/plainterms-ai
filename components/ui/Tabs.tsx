"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly content: ReactNode;
}

interface TabsProps {
  readonly items: readonly TabItem[];
  readonly defaultTab?: string;
  readonly label: string;
}

/**
 * Accessible tabs: arrow-key navigation, aria-selected, tab/tabpanel roles.
 * Content panels render lazily — only the active tab mounts.
 */
export function Tabs({ items, defaultTab, label }: TabsProps) {
  const baseId = useId();
  const [activeId, setActiveId] = useState<string>(defaultTab ?? items[0]?.id ?? "");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = useCallback(
    (index: number) => {
      const count = items.length;
      const next = ((index % count) + count) % count;
      const item = items[next];
      if (item !== undefined) {
        setActiveId(item.id);
        tabRefs.current[next]?.focus();
      }
    },
    [items],
  );

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusTab(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusTab(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(items.length - 1);
    }
  }

  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 border-b border-border">
        {items.map((item, index) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(item.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {activeItem === undefined ? null : (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${activeItem.id}`}
          aria-labelledby={`${baseId}-tab-${activeItem.id}`}
          className="pt-4"
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
