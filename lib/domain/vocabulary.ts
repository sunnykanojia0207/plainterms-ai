/**
 * Standard vocabularies — the ONLY place UI copy for severity, confidence,
 * flags, and information layers is defined. Components must use these
 * constants instead of inline strings so wording stays consistent and
 * legally safe (never alarming, never conclusive).
 */
import type {
  Confidence,
  DocumentType,
  FindingFlag,
  InformationLayer,
  SeverityLevel,
} from "@/lib/domain/types";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  "service-agreement": "Service Agreement",
  nda: "NDA",
  "statement-of-work": "Statement of Work",
} as const;

export const SEVERITY_META: Record<
  SeverityLevel,
  { readonly label: string; readonly description: string }
> = {
  neutral: {
    label: "Reviewed",
    description: " Reviewed with no concerns identified.",
  },
  obligation: {
    label: "Important obligation",
    description: "Something you must do under this agreement.",
  },
  "worth-reviewing": {
    label: "Worth reviewing",
    description: "Deserves a closer look before signing.",
  },
  "potential-concern": {
    label: "Potential concern",
    description: "May work against you. Understand it fully.",
  },
  critical: {
    label: "Needs attention",
    description: "High-impact item. Consider professional review.",
  },
} as const;

export const FINDING_FLAG_LABELS: Record<FindingFlag, string> = {
  "unusual-change": "Unusual change",
  "ambiguous-wording": "Ambiguous wording",
  "needs-clarification": "Needs clarification",
  "professional-review-recommended": "Professional review recommended",
} as const;

export const CONFIDENCE_META: Record<
  Confidence,
  { readonly label: string; readonly description: string }
> = {
  "very-high": {
    label: "Very high confidence",
    description: "The document states this explicitly and specifically.",
  },
  high: {
    label: "High confidence",
    description: "The document states this clearly.",
  },
  moderate: {
    label: "Moderate confidence",
    description: "The meaning appears clear but has some ambiguity.",
  },
  low: {
    label: "Low confidence",
    description: "The evidence is weak or unclear. Verify carefully.",
  },
} as const;

export const INFORMATION_LAYER_META: Record<
  InformationLayer,
  { readonly label: string; readonly leadIn: string }
> = {
  "document-fact": {
    label: "Document fact",
    leadIn: "The document states…",
  },
  "ai-interpretation": {
    label: "AI interpretation",
    leadIn: "This clause appears to mean…",
  },
  "general-information": {
    label: "General information",
    leadIn: "In general…",
  },
  "potential-option": {
    label: "Potential option",
    leadIn: "You could consider…",
  },
  "question-for-counsel": {
    label: "Question for a legal professional",
    leadIn: "Questions you may want to ask a qualified legal professional…",
  },
} as const;

/** Standard footer notice for AI-bearing surfaces. */
export const NOT_LEGAL_ADVICE_NOTICE =
  "PlainTerms provides general information and assistance. It is not legal advice and is not a replacement for a qualified legal professional.";

/** Neutral wording for the no-concerns state. Never a clean bill of health. */
export const NO_CONCERNS_COPY =
  "No potential concerns were identified from the available document.";
