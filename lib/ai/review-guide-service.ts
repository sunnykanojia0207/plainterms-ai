/**
 * Server Review Guide service — builds the guide through the orchestrator
 * and maps validated items onto domain objects, plus export-ready Markdown
 * rendered from the same validated bundle.
 */
import "server-only";
import { buildReviewGuide } from "@/lib/ai/review-guide";
import type {
  DocumentId,
  EvidenceReference,
  ReviewGuide,
  ReviewGuideItem,
} from "@/lib/domain/types";
import type { ReviewGuideDescriptor } from "@/lib/ai/review-guide";
import type { ReviewGuideEvidenceAI } from "@/lib/ai/review-guide-schemas";

function toEvidence(evidence: ReviewGuideEvidenceAI, index: number): EvidenceReference {
  return {
    clauseId: `${evidence.documentId}:${evidence.sectionId}:${index}`,
    documentId: evidence.documentId,
    sectionId: evidence.sectionId,
    location: `${evidence.sectionTitle} · p. ${evidence.pageNumber}`,
    quote: evidence.quote,
    pageNumber: evidence.pageNumber,
  };
}

const KIND_HEADING: Record<ReviewGuideItem["kind"], string> = {
  topic: "Topics worth discussing",
  "party-question": "Questions for the other party",
  "lawyer-question": "Questions for a legal professional",
  clarification: "Suggested clarifications",
  confirm: "Information to confirm",
  checklist: "Before-signing checklist",
};

export class PlainTermsReviewGuideService {
  constructor(
    private readonly resolve: (documentId: DocumentId) => Promise<ReviewGuideDescriptor>,
  ) {}

  async getReviewGuide(documentId: DocumentId): Promise<ReviewGuide> {
    const descriptor = await this.resolve(documentId);
    const bundle = await buildReviewGuide(descriptor);
    const items: ReviewGuideItem[] = bundle.items.map((item, index) => ({
      id: `${documentId}:guide-${index}`,
      kind: item.kind,
      documentId: item.evidence?.documentId ?? documentId,
      title: item.title,
      summary: item.summary,
      priority: item.priority,
      evidence: item.evidence === null ? null : toEvidence(item.evidence, index),
      uncertainty: item.uncertainty,
    }));
    return {
      documentId,
      compareDocumentId: bundle.compareDocumentId,
      items,
    };
  }

  async renderExport(guide: ReviewGuide): Promise<string> {
    const byKind = (kind: ReviewGuideItem["kind"]) =>
      guide.items.filter((item) => item.kind === kind);
    const section = (heading: string, items: readonly ReviewGuideItem[]) => {
      if (items.length === 0) {
        return "";
      }
      const lines = items.map((item) => {
        const evidence =
          item.evidence === null
            ? "_Not stated in the document — confirm independently._"
            : `> ${item.evidence.quote}\n> — ${item.evidence.location}`;
        const uncertainty = item.uncertainty === null ? "" : `\nUncertainty: ${item.uncertainty}`;
        return `### ${item.title} (${item.priority})\n\n${item.summary}\n\n${evidence}${uncertainty}`;
      });
      return `## ${heading}\n\n${lines.join("\n\n")}\n\n`;
    };
    const lawyer = byKind("lawyer-question");
    const lawyerBlock =
      lawyer.length === 0
        ? ""
        : `## For discussion with a qualified legal professional\n\n${lawyer
            .map((item) => `### ${item.title} (${item.priority})\n\n${item.summary}`)
            .join("\n\n")}\n\n`;
    return (
      `# Review Guide — ${guide.documentId}\n\n` +
      `_Preparation material, not legal advice. Every item traces to the document._\n\n` +
      section(KIND_HEADING.topic, byKind("topic")) +
      section(KIND_HEADING["party-question"], byKind("party-question")) +
      lawyerBlock +
      section("Suggested clarifications", byKind("clarification")) +
      section(KIND_HEADING.confirm, byKind("confirm")) +
      section(
        KIND_HEADING.checklist,
        byKind("checklist").map((item) => ({
          ...item,
          summary: `- [ ] ${item.summary}`,
        })),
      )
    );
  }
}
