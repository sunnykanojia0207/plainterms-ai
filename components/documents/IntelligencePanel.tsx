"use client";

import { useState } from "react";
import { AISkeleton } from "@/components/ui/Skeleton";
import { Badge, SeverityTag } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Text } from "@/components/ui/Text";
import { AIInsight } from "@/components/documents/AIInsight";
import { EvidenceReference } from "@/components/documents/EvidenceReference";
import { ReviewSection } from "@/components/documents/ReviewSection";
import { CONFIDENCE_META, SEVERITY_META } from "@/lib/domain/vocabulary";
import type { Clause, KeyDate, ObligationItem, ReviewFinding } from "@/lib/domain/types";
import type { SeverityLevel } from "@/lib/domain/types";
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

const SEVERITY_DOT: Record<SeverityLevel, string> = {
  neutral: "bg-tertiary",
  obligation: "bg-accent",
  "worth-reviewing": "bg-warning",
  "potential-concern": "bg-concern",
  critical: "bg-critical",
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
        <Notice
          title="AI review is temporarily unavailable"
          action={
            <Button variant="secondary" size="sm" onClick={retry}>
              Retry
            </Button>
          }
        >
          The document below is fully readable. Try the review again in a moment — nothing was lost.
        </Notice>
      ) : null}
      {status === "error" ? (
        <Notice
          title="The review didn't complete"
          action={
            <Button variant="secondary" size="sm" onClick={retry}>
              Retry
            </Button>
          }
        >
          {errorMessage ?? "Analysis failed unexpectedly."} You can keep reading below and retry.
        </Notice>
      ) : null}
      {status === "ready" && data !== null ? (
        <ReadyPanel
          data={data}
          selectedSectionId={selectedSectionId}
          onSelectSection={onSelectSection}
          documentId={documentId}
        />
      ) : null}
      <p className="text-xs text-secondary">
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
        <p className="text-sm text-secondary">Analyzing document…</p>
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
      className="flex size-5 items-center justify-center rounded-full bg-ai-muted text-xs font-bold text-ai-accent"
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
      <ReviewSection title="Summary" label="Summary">
        <Text className="mt-2 text-[15px]">{data.summary}</Text>
      </ReviewSection>

      {data.findings.length > 0 ? (
        <ReviewSection title="Important findings" label="Important findings">
          <div className="flex flex-col">
            {data.findings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                onJump={() => onSelectSection(finding.evidence.sectionId)}
              />
            ))}
          </div>
        </ReviewSection>
      ) : null}

      {selectedClause === undefined ? null : (
        <SelectedClauseCard
          clause={selectedClause}
          documentId={documentId}
          onJump={() => onSelectSection(selectedClause.evidenceSectionId)}
        />
      )}

      {data.obligations.length > 0 ? (
        <ReviewSection title="Key obligations" label="Key obligations">
          <ul className="flex flex-col">
            {data.obligations.map((item) => (
              <li key={item.id} className="border-b border-border py-2 text-sm last:border-b-0">
                <span className="font-medium">{OWNER_LABEL[item.owner]}: </span>
                {item.description}
                {item.dueHint === null ? null : (
                  <span className="text-secondary"> · {item.dueHint}</span>
                )}
              </li>
            ))}
          </ul>
        </ReviewSection>
      ) : null}

      {data.dates.length > 0 ? (
        <ReviewSection title="Important dates" label="Important dates">
          <ul className="flex flex-col">
            {data.dates.map((date) => (
              <li
                key={date.id}
                className="flex items-baseline justify-between gap-2 border-b border-border py-2 text-sm last:border-b-0"
              >
                <span>{date.label}</span>
                <span className="font-evidence text-xs text-secondary tabular-nums">
                  {date.date}
                </span>
              </li>
            ))}
          </ul>
        </ReviewSection>
      ) : null}

      {data.keyFacts.length > 0 ? (
        <ReviewSection title="Review suggestions" label="Review suggestions">
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {data.keyFacts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </ReviewSection>
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
    <article className="border-b border-border py-3 first:pt-1 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-full ${SEVERITY_DOT[finding.severity]}`}
        />
        <span className="sr-only">{SEVERITY_META[finding.severity].label}</span>
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
        <EvidenceReference
          quote={`“${finding.evidence.quote}”`}
          location={finding.evidence.location}
          className="mt-2"
        />
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
    <article aria-label={`Selected clause: ${clause.title}`}>
      <AIInsight marker={`AI interpretation · ${clause.title}`}>
        <p className="text-sm">{clause.plainExplanation}</p>
        <EvidenceReference
          quote={`“${clause.originalText}”`}
          location={`${clause.sectionRef} · p. ${clause.pageNumber} · ${confidence.label}`}
          className="mt-2"
        />
        {clause.ambiguities.length > 0 ? (
          <p className="mt-2 text-sm text-secondary">Unclear: {clause.ambiguities.join(" ")}</p>
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
      </AIInsight>
    </article>
  );
}
