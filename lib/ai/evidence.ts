/**
 * Evidence validator — the citation-or-silence guard.
 * Every AI finding MUST point at real document text: an existing section,
 * a quote of substance, and (normalized) containment within that section.
 * Findings that fail are dropped and counted — never displayed, never
 * repaired by guessing. Pure logic, fully unit-tested.
 */
import type { DocumentContent } from "@/lib/ai/content";

/** Minimum quote length that can actually support a finding. */
export const MIN_QUOTE_LENGTH = 20;

export interface EvidenceLike {
  readonly sectionId: string;
  readonly quote: string;
}

export interface EvidenceCheck {
  readonly ok: boolean;
  readonly reason?: string;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Shared normalization for quote matching across the AI layer. */
export function normalizeText(text: string): string {
  return normalize(text);
}

/** Validates one evidence reference against the document content. */
export function validateEvidence(evidence: EvidenceLike, content: DocumentContent): EvidenceCheck {
  const section = content.sections.find((item) => item.id === evidence.sectionId);
  if (section === undefined) {
    return { ok: false, reason: `Unknown section: ${evidence.sectionId}.` };
  }
  const quote = normalize(evidence.quote);
  if (quote.length < MIN_QUOTE_LENGTH) {
    return { ok: false, reason: "Quote too short to support a finding." };
  }
  if (!normalize(section.text).includes(quote)) {
    return { ok: false, reason: `Quote not found in section ${evidence.sectionId}.` };
  }
  return { ok: true };
}

export interface CitationFilterResult<T> {
  readonly kept: readonly T[];
  /** Count of findings dropped for missing/invalid evidence. Logged, not shown. */
  readonly dropped: number;
}

/**
 * Keeps only findings with valid evidence. The UI must render `kept` and
 * must never attempt to display dropped findings.
 */
export function enforceCitations<T extends { readonly evidence: EvidenceLike }>(
  findings: readonly T[],
  content: DocumentContent,
): CitationFilterResult<T> {
  const kept: T[] = [];
  let dropped = 0;
  for (const finding of findings) {
    if (validateEvidence(finding.evidence, content).ok) {
      kept.push(finding);
    } else {
      dropped += 1;
    }
  }
  return { kept, dropped };
}
