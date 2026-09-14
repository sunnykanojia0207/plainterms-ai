"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CONFIDENCE_META } from "@/lib/domain/vocabulary";
import type { AIResponse } from "@/lib/domain/types";

interface AnswerCardProps {
  readonly response: AIResponse;
  readonly headingRef?: (node: HTMLHeadingElement | null) => void;
  readonly onFollowUp: (question: string) => void;
}

function paragraphs(text: string): readonly string[] {
  return text
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

/**
 * Structured answer: answer, evidence with source jumps, uncertainty,
 * follow-ups, and professional-review prompts only when warranted.
 * Non-substantive classifications render their safe shapes.
 */
export function AnswerCard({ response, headingRef, onFollowUp }: AnswerCardProps) {
  const [showEvidence, setShowEvidence] = useState(true);
  const confidence = CONFIDENCE_META[response.confidence];
  const nonSubstantive =
    response.classification !== "document-fact" &&
    response.classification !== "document-interpretation";

  return (
    <article
      aria-label="Answer with evidence"
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="ai">Gemini answer</Badge>
        <Badge tone="neutral">{confidence.label}</Badge>
        {nonSubstantive ? <Badge tone="warning">Limited answer</Badge> : null}
      </div>

      <div>
        <h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold outline-none">
          Answer
        </h3>
        {paragraphs(response.answer).map((paragraph, index) => (
          <p key={`p-${index}`} className="mt-2 max-w-[65ch] text-[15px] leading-7">
            {paragraph}
          </p>
        ))}
      </div>

      {response.citations.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
              Evidence · {response.citations.length}
            </h4>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setShowEvidence((show) => !show)}
              aria-expanded={showEvidence}
            >
              {showEvidence ? "Hide evidence" : "Show evidence"}
            </Button>
          </div>
          {showEvidence ? (
            <ul className="flex flex-col gap-2">
              {response.citations.map((citation) => (
                <li
                  key={citation.clauseId}
                  className="rounded-md border border-border bg-bg px-3 py-2"
                >
                  <blockquote className="font-doc text-[15px]">
                    “{citation.quote}”
                    <footer className="font-evidence mt-1 text-xs text-text-secondary">
                      {citation.location}
                    </footer>
                  </blockquote>
                  <p className="mt-1.5">
                    <a
                      href={`/review/${citation.documentId}#viewer-${citation.sectionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-accent underline underline-offset-2"
                    >
                      Verify in document <span aria-hidden="true">↗</span>
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {response.ambiguities.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
            Uncertainty
          </h4>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm">
            {response.ambiguities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {response.gaps.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
            What the document doesn&apos;t establish
          </h4>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm">
            {response.gaps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {response.followUps.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
            Question to consider
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {response.followUps.map((followUp) => (
              <Button
                key={followUp}
                variant="secondary"
                size="sm"
                onClick={() => onFollowUp(followUp)}
              >
                {followUp}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {response.counselQuestions.length > 0 ? (
        <div className="rounded-md border border-ai/40 bg-ai-bg/40 px-3 py-2">
          <h4 className="text-sm font-semibold">Questions for a legal professional</h4>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm">
            {response.counselQuestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
