"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Heading } from "@/components/ui/Heading";
import { Drawer } from "@/components/ui/Drawer";
import { FeatureErrorBoundary } from "@/components/errors/error-boundary";
import { DocumentOutline } from "@/components/documents/DocumentOutline";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { IntelligencePanel } from "@/components/documents/IntelligencePanel";
import { ActionPackPanel } from "@/components/documents/ActionPackPanel";
import { ReviewGuidePanel } from "@/components/documents/ReviewGuidePanel";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/vocabulary";
import { getSectionsForFixture } from "@/lib/documents/sections";
import { useDocument } from "@/lib/documents/store";

interface ReviewWorkspaceProps {
  readonly documentId: string;
}

/**
 * Review workspace: fixture-backed document shell with a live Gemini
 * intelligence panel. Document ↔ panel stay synchronized through the
 * selected section: outline, pager, findings, and evidence all drive it.
 */
export function ReviewWorkspace({ documentId }: ReviewWorkspaceProps) {
  const document = useDocument(documentId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);

  function selectSection(sectionId: string): void {
    setActiveId(sectionId);
    setSelectedSectionId(sectionId);
  }

  if (document === null) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <ErrorState
          kind="not-found"
          detail="This document doesn't exist or was deleted. Open it from your library or upload it again."
          action={
            <Button size="sm" href="/documents">
              Open library
            </Button>
          }
        />
      </div>
    );
  }

  const sections = document.sections ?? getSectionsForFixture(document.fixtureId, document.id);
  const currentId = activeId ?? sections[0]?.id ?? null;
  const currentIndex = sections.findIndex((section) => section.id === currentId);
  const previous = currentIndex > 0 ? sections[currentIndex - 1] : undefined;
  const next =
    currentIndex >= 0 && currentIndex < sections.length - 1
      ? sections[currentIndex + 1]
      : undefined;

  return (
    <FeatureErrorBoundary scope="review-workspace">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
        <div className="sticky top-14 z-20 -mx-4 flex min-h-12 flex-wrap items-center gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Heading level={1} className="truncate">
              {document.title}
            </Heading>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Badge tone="accent">{DOCUMENT_TYPE_LABELS[document.type]}</Badge>
              <Badge tone="neutral">
                {document.pageCount} {document.pageCount === 1 ? "page" : "pages"}
              </Badge>
              <span className="font-evidence text-xs text-tertiary tabular-nums">
                v{document.currentVersion}
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOutlineOpen(true)}
              aria-label="Open document sections"
              className="lg:hidden"
            >
              Sections
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (previous !== undefined) {
                  selectSection(previous.id);
                }
              }}
              disabled={previous === undefined}
            >
              ← Previous
            </Button>
            <span aria-live="polite" className="text-sm text-secondary">
              Section {currentIndex + 1} of {sections.length}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (next !== undefined) {
                  selectSection(next.id);
                }
              }}
              disabled={next === undefined}
            >
              Next →
            </Button>
            <Button variant="secondary" size="sm" href="/compare">
              Compare
            </Button>
            <Button variant="secondary" size="sm" href="/ask">
              Ask
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem] lg:grid-cols-[15rem_minmax(0,1fr)_23.75rem]">
          <div className="hidden border-r border-border pr-4 lg:block">
            <div className="sticky top-32">
              <DocumentOutline sections={sections} activeId={currentId} onSelect={selectSection} />
            </div>
          </div>

          <section
            aria-label="Document viewer"
            className="min-w-0 rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-10"
          >
            <DocumentViewer sections={sections} activeId={currentId} onActiveChange={setActiveId} />
          </section>

          <aside
            aria-label="PlainTerms intelligence panel"
            className="flex min-w-0 flex-col gap-4 border-t border-border bg-background pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-4"
          >
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-semibold tracking-widest text-secondary uppercase">
                PlainTerms review
              </h2>
              <p className="text-xs text-tertiary">
                AI-assisted understanding — every claim cites its source.
              </p>
            </div>
            <IntelligencePanel
              documentId={document.id}
              fixtureId={document.fixtureId}
              title={document.title}
              version={document.currentVersion}
              selectedSectionId={selectedSectionId}
              onSelectSection={selectSection}
            />
            <div className="flex flex-col gap-2">
              <Button variant="secondary" size="sm" href="/ask">
                Ask about this document
              </Button>
              <Button variant="secondary" size="sm" href="/compare">
                Compare versions
              </Button>
            </div>
            <p className="text-xs text-secondary">
              In-document search arrives with document intelligence.
            </p>
            <h2 className="text-sm font-semibold tracking-wide text-secondary uppercase">
              Action Pack
            </h2>
            <ActionPackPanel
              documentId={document.id}
              fixtureId={document.fixtureId}
              title={document.title}
              version={document.currentVersion}
              onSelectSection={selectSection}
            />
            <h2 className="text-sm font-semibold tracking-wide text-secondary uppercase">
              Review Guide
            </h2>
            <ReviewGuidePanel
              documentId={document.id}
              fixtureId={document.fixtureId}
              title={document.title}
              version={document.currentVersion}
              onSelectSection={selectSection}
            />
          </aside>
        </div>
      </div>

      <Drawer open={outlineOpen} onClose={() => setOutlineOpen(false)} title="Sections" side="left">
        <DocumentOutline
          sections={sections}
          activeId={currentId}
          onSelect={(sectionId) => {
            selectSection(sectionId);
            setOutlineOpen(false);
          }}
        />
      </Drawer>
    </FeatureErrorBoundary>
  );
}
