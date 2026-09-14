"use client";

import { Badge } from "@/components/ui/Badge";
import { EvidenceReference } from "@/components/documents/EvidenceReference";
import { CONFIDENCE_META } from "@/lib/domain/vocabulary";
import type { ComparisonChange, SilenceFinding } from "@/lib/domain/types";

const KIND_LABEL: Record<ComparisonChange["type"], string> = {
  changed: "Changed",
  added: "Added",
  removed: "Removed",
};

const KIND_TONE = {
  changed: "warning",
  added: "success",
  removed: "critical",
} as const;

const SILENCE_LABEL = {
  removed: "Removed",
  "not-found": "Not found",
  uncertain: "Uncertain",
} as const;

function JumpLink({ href, label }: { readonly href: string; readonly label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium text-accent underline underline-offset-2"
    >
      {label} <span aria-hidden="true">↗</span>
      <span className="sr-only">(opens the document in a new tab)</span>
    </a>
  );
}

/**
 * Semantic redline card: original + new version side by side, then the
 * model's plain-language explanation. Legal text stays visible and
 * authoritative; the AI never replaces it.
 */
export function ChangeDetail({
  change,
  leftDocumentId,
  rightDocumentId,
}: {
  readonly change: ComparisonChange;
  readonly leftDocumentId: string;
  readonly rightDocumentId: string;
}) {
  const confidence = CONFIDENCE_META[change.confidence];
  return (
    <article
      aria-label={`Change detail: ${change.clauseTitle}`}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={KIND_TONE[change.type]}>{KIND_LABEL[change.type]}</Badge>
        <Badge tone={change.materiality === "material" ? "concern" : "neutral"}>
          {change.materiality === "material" ? "Potentially important" : "Cosmetic"}
        </Badge>
        <Badge tone="neutral">{confidence.label}</Badge>
      </div>

      <h3 className="text-lg font-semibold">{change.clauseTitle}</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="min-w-0">
          <p className="font-evidence mb-2 text-xs font-semibold tracking-wide text-secondary uppercase">
            Version 1{change.leftRef === null ? "" : ` · ${change.leftRef}`}
          </p>
          <EvidenceReference
            variant="plain"
            quote={change.leftText ?? "Not present in Version 1."}
            location={change.leftRef ?? ""}
            action={
              change.leftSectionId === null ? null : (
                <JumpLink
                  href={`/review/${leftDocumentId}#viewer-${change.leftSectionId}`}
                  label="Jump to Version 1"
                />
              )
            }
          />
        </div>
        <div className="min-w-0">
          <p className="font-evidence mb-2 text-xs font-semibold tracking-wide text-secondary uppercase">
            Version 2{change.rightRef === null ? "" : ` · ${change.rightRef}`}
          </p>
          <EvidenceReference
            variant="plain"
            quote={change.rightText ?? "Not present in Version 2."}
            location={change.rightRef ?? ""}
            action={
              change.rightSectionId === null ? null : (
                <JumpLink
                  href={`/review/${rightDocumentId}#viewer-${change.rightSectionId}`}
                  label="Jump to Version 2"
                />
              )
            }
          />
        </div>
      </div>

      <dl className="flex flex-col gap-3 sm:grid sm:grid-cols-[160px_1fr] sm:gap-x-4 sm:gap-y-3">
        <div className="sm:contents">
          <dt className="text-sm font-semibold">What changed</dt>
          <dd className="text-[15px]">{change.plainExplanation}</dd>
        </div>
        <div className="sm:contents">
          <dt className="text-sm font-semibold">Why it matters</dt>
          <dd className="text-[15px]">{change.whyItMatters}</dd>
        </div>
        <div className="sm:contents">
          <dt className="text-sm font-semibold">Potential implication</dt>
          <dd className="text-[15px]">{change.implication}</dd>
        </div>
        <div className="sm:contents">
          <dt className="text-sm font-semibold">Question to consider</dt>
          <dd className="text-[15px]">{change.questionToConsider}</dd>
        </div>
        <div className="sm:contents">
          <dt className="text-sm font-semibold">Potential next step</dt>
          <dd className="text-[15px]">{change.recommendedNextStep}</dd>
        </div>
      </dl>
    </article>
  );
}

/**
 * Silence card: three states stay visually and textually distinct.
 * Uncertainty is a complete state with verification guidance.
 */
export function SilenceCard({
  finding,
  leftDocumentId,
  rightDocumentId,
}: {
  readonly finding: SilenceFinding;
  readonly leftDocumentId: string;
  readonly rightDocumentId: string;
}) {
  const confidence = CONFIDENCE_META[finding.confidence];
  return (
    <article
      aria-label={`Silence finding: ${finding.subject}`}
      className="flex flex-col gap-3 rounded-lg border-2 border-dashed border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{SILENCE_LABEL[finding.state]}</Badge>
        <Badge tone="neutral">{confidence.label}</Badge>
      </div>
      <h3 className="text-base font-semibold">{finding.subject}</h3>
      <dl className="flex flex-col gap-2 text-[15px]">
        <div>
          <dt className="text-sm font-semibold">What we know</dt>
          <dd>{finding.whatWeKnow}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold">Where it appeared in Version 1</dt>
          <dd>
            <EvidenceReference
              quote={`“${finding.leftEvidence?.quote ?? ""}”`}
              location={finding.leftEvidence?.location ?? ""}
              className="mt-1"
              action={
                <JumpLink
                  href={`/review/${leftDocumentId}#viewer-${finding.leftEvidence?.sectionId ?? ""}`}
                  label="Jump to Version 1"
                />
              }
            />
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold">What was found in Version 2</dt>
          <dd>
            {finding.rightEvidence === null
              ? "No matching provision was located in Version 2."
              : `A possibly related passage was found: “${finding.rightEvidence.quote}” (${finding.rightEvidence.location}).`}
          </dd>
          {finding.rightEvidence === null ? null : (
            <p className="mt-2">
              <JumpLink
                href={`/review/${rightDocumentId}#viewer-${finding.rightEvidence.sectionId}`}
                label="Jump to Version 2"
              />
            </p>
          )}
        </div>
        {finding.whatRemainsUncertain === null ? null : (
          <div>
            <dt className="text-sm font-semibold">What remains uncertain</dt>
            <dd>{finding.whatRemainsUncertain}</dd>
          </div>
        )}
        <div>
          <dt className="text-sm font-semibold">Question to consider</dt>
          <dd>{finding.questionToConsider}</dd>
        </div>
      </dl>
    </article>
  );
}
