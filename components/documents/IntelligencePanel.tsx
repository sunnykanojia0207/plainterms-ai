"use client";

import { useState } from "react";
import { AISkeleton } from "@/components/ui/Skeleton";
import { Badge, SeverityTag } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { CONFIDENCE_META } from "@/lib/domain/vocabulary";
import type { Clause, KeyDate, ObligationItem, ReviewFinding } from "@/lib/domain/types";
import { useAnalysis, type AnalysisStatus } from "@/components/documents/use-analysis";

interface IntelligencePanelProps {
  readonly documentId: string;
  readonly fixtureId: string;
  readonly title: string;
  readonly version: number;
  readonly selectedSectionId: string | null;
  readonly onSelectSection: (sectionId: string) => void;
}

const OWNER_LABEL: Record<ObligationItem["owner"], string> = {
  you: "You",
  client: "Client",
  both: "Both",
};

/**
 * Gemini intelligence panel: summary, findings, selected-clause detail,
 * obligations, dates, and suggestions. Every claim carries evidence and a
 * jump back to the source. Findings render only after validation.
 */
export function IntelligencePanel({
  documentId,
  fixtureId,
  title,
  version,
  selectedSectionId,
  onSelectSection,
}: IntelligencePanelProps) {
  const { status, data, errorMessage, retry } = useAnalysis({
    documentId,
    fixtureId,
    title,
    version,
  });

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      <StatusHeader status={status} />
      {status === "loading" || status === "idle" ? <AISkeleton /> : null}
      {status === "unavailable" ? (
        <Card>
          <p className="text-base font-medium">AI review is temporarily unavailable</p>
          <Text tone="secondary" className="mt-1 text-sm">
            The document below is fully readable. Try the review again in a moment — nothing was
            lost.
          </Text>
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={retry}>
              Retry
            </Button>
          </div>
        </Card>
      ) : null}
      {status === "error" ? (
        <Card>
          <p className="text-base font-medium">The review didn&apos;t complete</p>
          <Text tone="secondary" className="mt-1 text-sm">
            {errorMessage ?? "Analysis failed unexpectedly."} You can keep reading below and retry.
          </Text>
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={retry}>
              Retry
            </Button>
          </div>
        </Card>
      ) : null}
      {status === "ready" && data !== null ? (
        <ReadyPanel
          data={data}
          selectedSectionId={selectedSectionId}
          onSelectSection={onSelectSection}
          documentId={documentId}
        />
      ) : null}
      <p className="text-xs text-text-secondary">
        PlainTerms provides informational assistance, not legal advice.
      </p>
    </div>
  );
}

function StatusHeader({ status }: { readonly status: AnalysisStatus }) {
  if (status === "ready") {
    return (
      <div className="flex items-center gap-2">
        <GeminiMark />
        <h2 className="text-base font-semibold">PlainTerms reviewed this document</h2>
      </div>
    );
  }
  if (status === "loading" || status === "idle") {
    return (
      <div className="flex items-center gap-2" role="status">
        <GeminiMark />
        <p className="text-sm text-text-secondary">Gemini · Analyzing document…</p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <GeminiMark />
      <h2 className="text-base font-semibold">Document review</h2>
    </div>
  );
}

function GeminiMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-5 items-center justify-center rounded-full bg-ai-bg text-xs font-bold text-ai"
    >
      ✦
    </span>
  );
}

interface ReadyPanelProps {
  readonly data: {
    readonly summary: string;
    readonly keyFacts: readonly string[];
    readonly findings: readonly ReviewFinding[];
    readonly clauses: readonly Clause[];
    readonly obligations: readonly ObligationItem[];
    readonly dates: readonly KeyDate[];
  };
  readonly selectedSectionId: string | null;
  readonly onSelectSection: (sectionId: string) => void;
  readonly documentId: string;
}

function ReadyPanel({ data, selectedSectionId, onSelectSection, documentId }: ReadyPanelProps) {
  const selectedClause =
    selectedSectionId === null
      ? undefined
      : data.clauses.find((clause) => clause.evidenceSectionId === selectedSectionId);

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Summary">
        <h3 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
          Summary
        </h3>
        <Text className="mt-2 text-[15px]">{data.summary}</Text>
      </section>

      {data.findings.length > 0 ? (
        <section aria-label="Important findings" className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
            Important findings
          </h3>
          {data.findings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              onJump={() => onSelectSection(finding.evidence.sectionId)}
            />
          ))}
        </section>
      ) : null}

      {selectedClause === undefined ? null : (
        <SelectedClauseCard
          clause={selectedClause}
          documentId={documentId}
          onJump={() => onSelectSection(selectedClause.evidenceSectionId)}
        />
      )}

      {data.obligations.length > 0 ? (
        <section aria-label="Key obligations" className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
            Key obligations
          </h3>
          <ul className="flex flex-col gap-2">
            {data.obligations.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="font-medium">{OWNER_LABEL[item.owner]}: </span>
                {item.description}
                {item.dueHint === null ? null : (
                  <span className="text-text-secondary"> · {item.dueHint}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.dates.length > 0 ? (
        <section aria-label="Important dates" className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
            Important dates
          </h3>
          <ul className="flex flex-col gap-2">
            {data.dates.map((date) => (
              <li
                key={date.id}
                className="flex items-baseline justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                <span>{date.label}</span>
                <span className="font-evidence text-xs text-text-secondary">{date.date}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.keyFacts.length > 0 ? (
        <section aria-label="Review suggestions" className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
            Review suggestions
          </h3>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {data.keyFacts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function FindingCard({
  finding,
  onJump,
}: {
  readonly finding: ReviewFinding;
  readonly onJump: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const confidence = CONFIDENCE_META[finding.confidence];
  return (
    <article className="rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityTag severity={finding.severity} />
        <Badge tone="neutral">{confidence.label}</Badge>
      </div>
      <h4 className="mt-2 text-[15px] font-semibold">{finding.headline}</h4>
      <p className="mt-1 text-sm">{finding.whyItMatters}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="tertiary" size="sm" onClick={() => setExpanded((open) => !open)}>
          {expanded ? "Hide evidence" : "Show evidence"}
        </Button>
        <Button variant="tertiary" size="sm" onClick={onJump}>
          View in document
        </Button>
      </div>
      {expanded ? (
        <blockquote className="font-doc mt-2 border-l-2 border-evidence-border bg-evidence/40 px-3 py-2 text-[15px]">
          “{finding.evidence.quote}”
          <footer className="font-evidence mt-1 text-xs text-text-secondary">
            {finding.evidence.location}
          </footer>
        </blockquote>
      ) : null}
    </article>
  );
}

function SelectedClauseCard({
  clause,
  documentId,
  onJump,
}: {
  readonly clause: Clause;
  readonly documentId: string;
  readonly onJump: () => void;
}) {
  const confidence = CONFIDENCE_META[clause.confidence];
  return (
    <article
      aria-label={`Selected clause: ${clause.title}`}
      className="rounded-lg border border-ai/40 bg-ai-bg/40 p-3"
    >
      <p className="text-xs font-medium tracking-wide text-ai uppercase">
        AI interpretation · {clause.title}
      </p>
      <p className="mt-1 text-sm">{clause.plainExplanation}</p>
      <blockquote className="font-doc mt-2 border-l-2 border-evidence-border bg-surface px-3 py-2 text-[15px]">
        “{clause.originalText}”
        <footer className="font-evidence mt-1 text-xs text-text-secondary">
          {clause.sectionRef} · p. {clause.pageNumber} · {confidence.label}
        </footer>
      </blockquote>
      {clause.ambiguities.length > 0 ? (
        <p className="mt-2 text-sm text-text-secondary">Unclear: {clause.ambiguities.join(" ")}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="tertiary" size="sm" onClick={onJump}>
          Jump to source
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          href={`/ask?doc=${documentId}&section=${clause.evidenceSectionId}`}
        >
          Ask about this clause
        </Button>
      </div>
    </article>
  );
}
