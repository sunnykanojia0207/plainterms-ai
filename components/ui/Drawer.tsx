"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type DrawerSide = "left" | "right" | "bottom";

interface DrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  readonly side?: DrawerSide;
  readonly children: ReactNode;
  readonly className?: string;
}

const SIDE_CLASSES: Record<DrawerSide, string> = {
  left: "left-0 top-0 h-full w-full max-w-sm rounded-r-lg",
  right: "right-0 top-0 h-full w-full max-w-md rounded-l-lg",
  bottom: "bottom-0 left-0 max-h-[85vh] w-full rounded-t-lg",
};

/**
 * Accessible drawer / bottom sheet: Escape to close, focus restore,
 * aria-modal, body scroll lock. Used for settings, mobile nav, sheets.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  side = "right",
  children,
  className,
}: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    previouslyFocused.current = document.activeElement;
    containerRef.current?.focus();

    function onKeyDown(event: globalThis.KeyboardEvent): void {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        tabIndex={-1}
        className={cn(
          "absolute flex flex-col overflow-y-auto bg-surface-raised p-6 shadow-md",
          SIDE_CLASSES[side],
          className,
        )}
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {description === undefined ? null : (
          <p id={descriptionId} className="mt-1 text-sm text-secondary">
            {description}
          </p>
        )}
        <div className="mt-4 flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

/** Bottom-sheet variant of Drawer for mobile-first flows. */
export function Sheet(props: Omit<DrawerProps, "side">) {
  return <Drawer {...props} side="bottom" />;
}
