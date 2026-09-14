/**
 * PlainTerms domain model — the ONLY place domain types live.
 * Source: LEGAL_GENAI_PRODUCT_BLUEPRINT.md §13 (clause objects), §16 (evidence),
 * §15 (comparison), Action Pack shape.
 *
 * These types describe data. Behavior belongs in lib/services/* (interfaces)
 * and future feature modules. Do not duplicate these types elsewhere.
 */

export type DocumentId = string;
export type ClauseId = string;
export type ComparisonId = string;

/** MVP document scope. Nothing else is supported (blueprint §6). */
export type DocumentType = "service-agreement" | "nda" | "statement-of-work";

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "ready"
  | "reviewing"
  | "comparison-ready"
  | "needs-attention"
  | "failed"
  | "deleted";

/** Who an obligation or clause primarily affects. */
export type AffectedParty = "you" | "client" | "both";

/** Standard severity vocabulary (UI spec §Risk Language). Color never stands alone. */
export type SeverityLevel =
  "neutral" | "obligation" | "worth-reviewing" | "potential-concern" | "critical";

/** Additional finding flags that refine a severity level. */
export type FindingFlag =
  | "unusual-change"
  | "ambiguous-wording"
  | "needs-clarification"
  | "professional-review-recommended";

/** Qualitative confidence. Never numeric, never fabricated. */
export type Confidence = "very-high" | "high" | "moderate" | "low";

/** The five information layers. Visually non-interchangeable (UI spec §9). */
export type InformationLayer =
  | "document-fact"
  | "ai-interpretation"
  | "general-information"
  | "potential-option"
  | "question-for-counsel";

export interface DocumentParty {
  readonly name: string;
  readonly role: string;
}

export interface Document {
  readonly id: DocumentId;
  readonly title: string;
  readonly type: DocumentType;
  readonly status: DocumentStatus;
  readonly pageCount: number;
  readonly parties: readonly DocumentParty[];
  readonly currentVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DocumentVersion {
  readonly id: string;
  readonly documentId: DocumentId;
  readonly versionNumber: number;
  readonly label: string;
  readonly createdAt: string;
}

export interface DocumentSection {
  readonly id: string;
  readonly documentId: DocumentId;
  readonly title: string;
  readonly level: number;
  readonly pageNumber: number;
  readonly clauseIds: readonly ClauseId[];
}

export interface Obligation {
  readonly description: string;
  readonly owner: AffectedParty;
}

export interface Clause {
  readonly id: ClauseId;
  readonly documentId: DocumentId;
  readonly sectionRef: string;
  /** Section id for viewer jumps. Population is mandatory for AI clauses. */
  readonly evidenceSectionId: string;
  readonly pageNumber: number;
  readonly title: string;
  readonly plainExplanation: string;
  readonly originalText: string;
  readonly importance: number;
  readonly severity: SeverityLevel;
  readonly flags: readonly FindingFlag[];
  readonly obligation: Obligation | null;
  readonly affectedParty: AffectedParty;
  readonly questionsToConsider: readonly string[];
  readonly confidence: Confidence;
  readonly ambiguities: readonly string[];
}

export interface EvidenceReference {
  readonly clauseId: ClauseId;
  readonly documentId: DocumentId;
  /** Section id for viewer jumps. */
  readonly sectionId: string;
  readonly location: string;
  readonly quote: string;
  readonly pageNumber: number;
}

export type ChangeType = "same" | "changed" | "added" | "removed";

export interface ComparisonChange {
  readonly id: string;
  readonly type: Exclude<ChangeType, "same">;
  readonly clauseTitle: string;
  /** Clause category (payment, termination, …) for filtering. */
  readonly category: string;
  /** Display importance derived from model materiality. */
  readonly importance: "high" | "normal";
  readonly leftRef: string | null;
  readonly rightRef: string | null;
  readonly leftSectionId: string | null;
  readonly rightSectionId: string | null;
  readonly leftText: string | null;
  readonly rightText: string | null;
  readonly plainExplanation: string;
  readonly whyItMatters: string;
  /** Practical consequence scenario. */
  readonly implication: string;
  readonly materiality: "material" | "cosmetic";
  /** Which side the change favors, from the freelancer's perspective. */
  readonly favors: "you" | "client" | "neutral";
  readonly questionToConsider: string;
  readonly recommendedNextStep: string;
  readonly confidence: Confidence;
}

/** Silence states — intentionally distinct, never conflated. */
export type SilenceState = "removed" | "not-found" | "uncertain";

export interface SilenceFinding {
  readonly id: string;
  readonly state: SilenceState;
  readonly subject: string;
  readonly leftEvidence: EvidenceReference | null;
  readonly rightEvidence: EvidenceReference | null;
  readonly whatWeKnow: string;
  readonly whatRemainsUncertain: string | null;
  readonly questionToConsider: string;
  readonly confidence: Confidence;
}

export interface Comparison {
  readonly id: ComparisonId;
  readonly leftDocumentId: DocumentId;
  readonly leftVersion: number;
  readonly rightDocumentId: DocumentId;
  readonly rightVersion: number;
  readonly changes: readonly ComparisonChange[];
  readonly silence: readonly SilenceFinding[];
  readonly unchangedCount: number;
  /** Model-generated plain-language summary with real counts. */
  readonly summary: string;
  readonly verdict: string;
  readonly verdictDrivers: readonly string[];
}

export interface ReviewFinding {
  readonly id: string;
  readonly clauseId: ClauseId;
  readonly headline: string;
  readonly whyItMatters: string;
  readonly severity: SeverityLevel;
  readonly confidence: Confidence;
  /** Full evidence for quotes and source jumps. */
  readonly evidence: EvidenceReference;
}

export interface ObligationItem {
  readonly id: string;
  readonly description: string;
  readonly owner: AffectedParty;
  readonly dueHint: string | null;
  readonly clauseId: ClauseId;
  /** Section id for viewer jumps. */
  readonly evidenceSectionId: string;
}

export interface KeyDate {
  readonly id: string;
  readonly label: string;
  readonly date: string;
  readonly clauseId: ClauseId;
  /** Section id for viewer jumps. */
  readonly evidenceSectionId: string;
}

export interface NegotiationPoint {
  readonly id: string;
  readonly ask: string;
  readonly fallback: string;
  readonly leverageNote: string;
  readonly clauseId: ClauseId;
}

export interface LawyerQuestion {
  readonly id: string;
  readonly question: string;
  readonly concern: string;
  readonly ambiguousText: string;
  /** What a resolved answer unlocks: sign, negotiate, or walk away. */
  readonly unlocks: "sign" | "negotiate" | "walk-away";
}

export interface ActionPack {
  readonly documentId: DocumentId;
  readonly items: readonly ActionPackItem[];
}

/** Qualitative priority: importance, never legal severity. */
export type ActionPriority = "high" | "medium" | "low";

export type ActionPackItemKind =
  "obligation" | "date" | "review" | "clarify" | "lawyer" | "checklist" | "info-needed";

/**
 * One grounded preparation item. Evidence is required for every kind
 * except info-needed (which reports absence) and checklist items framed
 * as information to confirm.
 */
export interface ActionPackItem {
  readonly id: string;
  readonly kind: ActionPackItemKind;
  readonly title: string;
  readonly summary: string;
  readonly priority: ActionPriority;
  readonly evidence: EvidenceReference | null;
  readonly uncertainty: string | null;
  readonly nextStep: string | null;
}

export type ReviewGuideItemKind =
  "topic" | "party-question" | "lawyer-question" | "clarification" | "confirm" | "checklist";

/**
 * One conversation-preparation item. Evidence is required for every kind
 * except confirm (which reports missing or ambiguous information).
 * Never advice, never a demanded outcome — the human decides.
 */
export interface ReviewGuideItem {
  readonly id: string;
  readonly kind: ReviewGuideItemKind;
  /** Document this item's evidence comes from (primary or compared). */
  readonly documentId: DocumentId;
  readonly title: string;
  readonly summary: string;
  readonly priority: ActionPriority;
  readonly evidence: EvidenceReference | null;
  readonly uncertainty: string | null;
}

export interface ReviewGuide {
  readonly documentId: DocumentId;
  readonly compareDocumentId: DocumentId | null;
  readonly items: readonly ReviewGuideItem[];
}

export interface Question {
  readonly id: string;
  readonly documentIds: readonly DocumentId[];
  readonly text: string;
  /** Focused clause context, when asked from a selected section. */
  readonly sectionId: string | null;
  readonly createdAt: string;
}

/** How the model classified a question. Drives safe response shapes. */
export type QuestionClassification =
  | "document-fact"
  | "document-interpretation"
  | "missing-information"
  | "out-of-scope-legal-advice"
  | "unrelated";

export interface AIResponse {
  readonly answer: string;
  readonly classification: QuestionClassification;
  readonly citations: readonly EvidenceReference[];
  readonly confidence: Confidence;
  readonly ambiguities: readonly string[];
  /** Aspects the document is silent on. Surfaced, never hidden. */
  readonly gaps: readonly string[];
  readonly followUps: readonly string[];
  readonly counselQuestions: readonly string[];
}

/** Persisted conversation metadata: questions and outcomes, never answers. */
export interface QuestionHistoryEntry {
  readonly question: string;
  readonly timestamp: string;
  readonly documentId: DocumentId;
  readonly version: number;
  readonly status: "ready" | "insufficient" | "out-of-scope" | "error";
}
