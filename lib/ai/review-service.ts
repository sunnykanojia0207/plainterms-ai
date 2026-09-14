/**
 * Server review service — implements the ReviewService boundary with real
 * Gemini analysis. Maps validated AI shapes onto domain objects; every
 * mapped object keeps its source section reference for UI tracing.
 */
import "server-only";
import { analyzeFull, type AnalysisDescriptor } from "@/lib/ai/analyze";
import type { DocumentSummary, ReviewService } from "@/lib/services";
import type {
  Clause,
  DocumentId,
  KeyDate,
  ObligationItem,
  ReviewFinding,
} from "@/lib/domain/types";
import type {
  ClauseFinding,
  ImportantDateAI,
  ObligationAI,
  PotentialConcernAI,
} from "@/lib/ai/schemas";

/** Display ordering only — not legal weight. */
const CATEGORY_IMPORTANCE: Record<string, number> = {
  payment: 5,
  termination: 5,
  "intellectual-property": 5,
  restrictions: 5,
  liability: 5,
  confidentiality: 4,
  renewal: 4,
  term: 3,
  "dispute-resolution": 3,
  notice: 3,
  responsibilities: 3,
};

const CATEGORY_PARTY: Record<string, "you" | "client" | "both"> = {
  restrictions: "you",
  payment: "both",
  term: "both",
  termination: "both",
  confidentiality: "both",
  "intellectual-property": "both",
  liability: "both",
  "dispute-resolution": "both",
  renewal: "both",
  notice: "both",
  responsibilities: "both",
};

const CONCERN_SEVERITY: Record<PotentialConcernAI["severity"], ReviewFinding["severity"]> = {
  "potential-concern": "potential-concern",
  "worth-reviewing": "worth-reviewing",
  "important-obligation": "obligation",
  "unusual-wording": "worth-reviewing",
  "ambiguous-wording": "worth-reviewing",
  "needs-clarification": "worth-reviewing",
};

function clauseIdFor(documentId: DocumentId, finding: ClauseFinding): string {
  return `${documentId}:${finding.evidence.sectionId}:${finding.category}`;
}

function sectionRefFor(documentId: DocumentId, sectionId: string): string {
  return `${documentId}:${sectionId}`;
}

function toClause(finding: ClauseFinding, documentId: DocumentId): Clause {
  return {
    id: clauseIdFor(documentId, finding),
    documentId,
    sectionRef: finding.evidence.sectionTitle,
    evidenceSectionId: finding.evidence.sectionId,
    pageNumber: finding.evidence.pageNumber,
    title: finding.title,
    plainExplanation: finding.interpretation,
    originalText: finding.evidence.quote,
    importance: CATEGORY_IMPORTANCE[finding.category] ?? 3,
    severity: "worth-reviewing",
    flags: finding.ambiguity === null ? [] : ["ambiguous-wording"],
    obligation: null,
    affectedParty: CATEGORY_PARTY[finding.category] ?? "both",
    questionsToConsider: [],
    confidence: finding.confidence,
    ambiguities: finding.ambiguity === null ? [] : [finding.ambiguity],
  };
}

export class PlainTermsReviewService implements ReviewService {
  constructor(private readonly resolve: (documentId: DocumentId) => Promise<AnalysisDescriptor>) {}

  private bundle(documentId: DocumentId) {
    return this.resolve(documentId).then((descriptor) => analyzeFull(descriptor));
  }

  async getSummary(documentId: DocumentId): Promise<DocumentSummary> {
    const bundle = await this.bundle(documentId);
    return {
      documentId,
      summary: bundle.summary.points.join(" "),
      keyFacts: bundle.summary.points.slice(0, 5),
    };
  }

  async getFindings(documentId: DocumentId): Promise<readonly ReviewFinding[]> {
    const bundle = await this.bundle(documentId);
    return bundle.concerns.map((concern, index) => ({
      id: `${documentId}:finding-${index}`,
      clauseId: sectionRefFor(documentId, concern.evidence.sectionId),
      headline: concern.title,
      whyItMatters: concern.concern,
      severity: CONCERN_SEVERITY[concern.severity],
      confidence: concern.confidence,
      evidence: {
        clauseId: sectionRefFor(documentId, concern.evidence.sectionId),
        documentId,
        sectionId: concern.evidence.sectionId,
        location: `${concern.evidence.sectionTitle} · p. ${concern.evidence.pageNumber}`,
        quote: concern.evidence.quote,
        pageNumber: concern.evidence.pageNumber,
      },
    }));
  }

  async getClauses(documentId: DocumentId): Promise<readonly Clause[]> {
    const bundle = await this.bundle(documentId);
    const concernedSections = new Set(bundle.concerns.map((concern) => concern.evidence.sectionId));
    return bundle.clauses.map((finding) => {
      const clause = toClause(finding, documentId);
      if (concernedSections.has(finding.evidence.sectionId)) {
        return { ...clause, severity: "potential-concern" as const };
      }
      return clause;
    });
  }

  async getObligations(documentId: DocumentId): Promise<readonly ObligationItem[]> {
    const bundle = await this.bundle(documentId);
    return bundle.obligations.map((item: ObligationAI, index: number) => ({
      id: `${documentId}:obligation-${index}`,
      description: item.obligation,
      owner: item.party,
      dueHint: item.deadline,
      clauseId: sectionRefFor(documentId, item.evidence.sectionId),
      evidenceSectionId: item.evidence.sectionId,
    }));
  }

  async getKeyDates(documentId: DocumentId): Promise<readonly KeyDate[]> {
    const bundle = await this.bundle(documentId);
    return bundle.dates.map((item: ImportantDateAI, index: number) => ({
      id: `${documentId}:date-${index}`,
      label: item.label,
      date: item.date,
      clauseId: sectionRefFor(documentId, item.evidence.sectionId),
      evidenceSectionId: item.evidence.sectionId,
    }));
  }
}
