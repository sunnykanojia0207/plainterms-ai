"use client";

import { useEffect, useRef } from "react";
import type { FixtureSection } from "@/lib/documents/fixture";

interface DocumentViewerProps {
  readonly sections: readonly FixtureSection[];
  readonly activeId: string | null;
  readonly onActiveChange: (sectionId: string) => void;
}

/**
 * Readable legal-document viewer. Serif voice, real section structure,
 * scroll-spy current-section reporting. Never one giant paragraph.
 */
export function DocumentViewer({ sections, activeId, onActiveChange }: DocumentViewerProps) {
  const rootRef = useRef<HTMLElement>(null);
  // Section selected from the outline whose programmatic scroll is in
  // flight. A ref (not state): scroll position is not render state, and
  // the spy only needs the latest value inside its observer callback.
  const manualTargetRef = useRef<string | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  // Scroll to a section selected from the outline.
  useEffect(() => {
    if (activeId === null || activeId === manualTargetRef.current) {
      return;
    }
    manualTargetRef.current = activeId;
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
    }
    // Progressive enhancement: no-op where smooth scrolling is unavailable
    // (tests, older engines). Section state still updates.
    document
      .getElementById(`viewer-${activeId}`)
      ?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    clearTimerRef.current = window.setTimeout(() => {
      manualTargetRef.current = null;
    }, 1200);
  }, [activeId]);

  // Report the section in view as the user scrolls. Spy reports are
  // suppressed while a programmatic outline scroll is in flight (ref).
  // IntersectionObserver is guarded for environments without it (tests,
  // older engines): the viewer remains fully readable, only spy updates
  // are skipped.
  useEffect(() => {
    const root = rootRef.current;
    if (root === null || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (manualTargetRef.current !== null) {
          return;
        }
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          .at(0);
        const id = visible?.target.getAttribute("data-section-id");
        if (id !== null && id !== undefined && id !== "") {
          onActiveChange(id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const child of root.querySelectorAll("[data-section-id]")) {
      observer.observe(child);
    }
    return () => {
      observer.disconnect();
    };
  }, [sections, onActiveChange]);

  return (
    <article
      ref={rootRef}
      aria-label="Document text"
      className="font-doc mx-auto max-w-[65ch] text-primary"
    >
      {sections.map((section) => {
        const active = section.id === activeId;
        return (
          <section
            key={section.id}
            id={`viewer-${section.id}`}
            data-section-id={section.id}
            aria-labelledby={`viewer-title-${section.id}`}
            className={`scroll-mt-32 border-b border-border py-6 first:pt-0 last:border-b-0 ${
              active
                ? "border-l-2 border-l-warning bg-warning-muted/40"
                : "border-l-2 border-l-transparent"
            } -ml-3 pl-3 sm:-ml-4 sm:pl-4`}
          >
            <h2
              id={`viewer-title-${section.id}`}
              className="mb-4 font-ui text-lg font-semibold tracking-tight"
            >
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.id}-p${index}`} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </section>
        );
      })}
    </article>
  );
}
