/**
 * Server comparison service — implements the ComparisonService boundary.
 * Deterministic alignment plus Gemini semantic judgment, mapped onto
 * domain objects with dual-version evidence for source jumps.
 */
import "server-only";
import { compareDocuments, type CompareDescriptor } from "@/lib/ai/compare";
import type { ComparisonService } from "@/lib/services";
import type {
  Comparison,
  ComparisonChange,
  DocumentId,
  EvidenceReference,
  SilenceFinding,
} from "@/lib/domain/types";
import type {
  ComparisonChangeAI,
  ComparisonEvidenceAI,
  SilenceFindingAI,
} from "@/lib/ai/comparison-schemas";

function evidenceRef(evidence: ComparisonEvidenceAI, documentId: DocumentId): EvidenceReference {
  return {
    clauseId: `${documentId}:${evidence.sectionId}`,
    documentId,
    sectionId: evidence.sectionId,
    location: `${evidence.sectionTitle} · p. ${evidence.pageNumber}`,
    quote: evidence.quote,
    pageNumber: evidence.pageNumber,
  };
}

function shortRef(evidence: ComparisonEvidenceAI): string {
  return `${evidence.sectionTitle} · p. ${evidence.pageNumber}`;
}

function toChange(
  change: ComparisonChangeAI,
  index: number,
  comparisonId: string,
): ComparisonChange {
  return {
    id: `${comparisonId}:change-${index}`,
    type: change.kind,
    clauseTitle: change.title,
    category: change.category,
    importance: change.materiality === "material" ? "high" : "normal",
    leftRef: change.leftEvidence === null ? null : shortRef(change.leftEvidence),
    rightRef: change.rightEvidence === null ? null : shortRef(change.rightEvidence),
    leftSectionId: change.leftEvidence?.sectionId ?? null,
    rightSectionId: change.rightEvidence?.sectionId ?? null,
    leftText: change.leftEvidence?.quote ?? null,
    rightText: change.rightEvidence?.quote ?? null,
    plainExplanation: change.whatChanged,
    whyItMatters: change.whyItMatters,
    implication: change.implication,
    materiality: change.materiality,
    favors: change.favors,
    questionToConsider: change.questionToConsider,
    recommendedNextStep: change.nextStep,
    confidence: change.confidence,
  };
}

function toSilence(
  finding: SilenceFindingAI,
  index: number,
  comparisonId: string,
  leftDocumentId: DocumentId,
  rightDocumentId: DocumentId,
): SilenceFinding {
  return {
    id: `${comparisonId}:silence-${index}`,
    state: finding.state,
    subject: finding.subject,
    leftEvidence: evidenceRef(finding.leftEvidence, leftDocumentId),
    rightEvidence:
      finding.rightEvidence === null ? null : evidenceRef(finding.rightEvidence, rightDocumentId),
    whatWeKnow: finding.whatWeKnow,
    whatRemainsUncertain: finding.whatRemainsUncertain,
    questionToConsider: finding.questionToConsider,
    confidence: finding.confidence,
  };
}

export class PlainTermsComparisonService implements ComparisonService {
  constructor(private readonly resolve: (documentId: DocumentId) => Promise<CompareDescriptor>) {}

  async compareVersions(
    leftDocumentId: DocumentId,
    rightDocumentId: DocumentId,
  ): Promise<Comparison> {
    const [left, right] = await Promise.all([
      this.resolve(leftDocumentId),
      this.resolve(rightDocumentId),
    ]);
    const bundle = await compareDocuments(left, right);
    return {
      id: bundle.comparisonId,
      leftDocumentId,
      leftVersion: left.version,
      rightDocumentId,
      rightVersion: right.version,
      changes: bundle.changes.map((change, index) => toChange(change, index, bundle.comparisonId)),
      silence: bundle.silence.map((finding, index) =>
        toSilence(finding, index, bundle.comparisonId, leftDocumentId, rightDocumentId),
      ),
      unchangedCount: bundle.unchanged.length,
      summary: bundle.summary,
      verdict: bundle.verdict,
      verdictDrivers: [...bundle.verdictDrivers],
    };
  }
}
