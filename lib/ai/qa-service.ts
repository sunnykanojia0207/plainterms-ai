/**
 * Server Q&A service — answers document questions through the orchestrator
 * and maps validated answers onto the AIResponse domain object.
 */
import "server-only";
import { answerQuestion, type QARequest } from "@/lib/ai/qa";
import type { DocumentContent } from "@/lib/ai/content";
import { resolveDocumentContent } from "@/lib/ai/document-content";
import { normalizeText } from "@/lib/ai/evidence";
import type { AIResponse, EvidenceReference } from "@/lib/domain/types";
import type { AnswerEvidenceAI } from "@/lib/ai/qa-schemas";

export interface AskInput {
  readonly documents: QARequest["documents"];
  readonly question: string;
  readonly sectionId?: string | null;
  readonly history?: QARequest["history"];
}

export interface AskResult {
  readonly response: AIResponse;
  readonly cached: boolean;
}

function toCitation(
  evidence: AnswerEvidenceAI,
  documentId: string,
  index: number,
): EvidenceReference {
  return {
    clauseId: `${documentId}:${evidence.sectionId}:${index}`,
    documentId,
    sectionId: evidence.sectionId,
    location: `${evidence.sectionTitle} · p. ${evidence.pageNumber}`,
    quote: evidence.quote,
    pageNumber: evidence.pageNumber,
  };
}

/**
 * Attributes each citation to the document whose text actually contains
 * the quote. Section ids are shared across fixture versions, so only
 * quote matching identifies the true source. Content resolves through the
 * canonical records-first resolver, so fixture-backed and record-backed
 * (uploaded) documents behave identically; unknown documents throw
 * UnknownDocumentError, which the routes map to the safe 404 path.
 */
function ownerOf(
  evidence: AnswerEvidenceAI,
  contents: ReadonlyMap<string, DocumentContent>,
  fallbackId: string,
): string {
  const quote = normalizeText(evidence.quote);
  for (const [documentId, content] of contents) {
    const found = content.sections.some((section) => normalizeText(section.text).includes(quote));
    if (found) {
      return documentId;
    }
  }
  return fallbackId;
}

export class PlainTermsQAService {
  async ask(input: AskInput): Promise<AskResult> {
    const result = await answerQuestion({
      documents: input.documents,
      question: input.question,
      sectionId: input.sectionId ?? null,
      history: input.history ?? [],
    });
    const answer = result.answer;
    const fallbackId = input.documents[0]?.documentId ?? "unknown";
    const contents = new Map<string, DocumentContent>();
    for (const doc of input.documents) {
      contents.set(doc.documentId, resolveDocumentContent(doc));
    }
    const citations = answer.evidence.map((evidence, index) =>
      toCitation(evidence, ownerOf(evidence, contents, fallbackId), index),
    );
    const response: AIResponse = {
      answer: answer.answer,
      classification: answer.classification,
      citations,
      confidence: answer.confidence,
      ambiguities: answer.uncertainty === "" ? [] : [answer.uncertainty],
      gaps:
        answer.classification === "missing-information"
          ? ["The document does not establish an answer."]
          : [],
      followUps: [...answer.followUps],
      counselQuestions: [...answer.counselQuestions],
    };
    return { response, cached: result.cached };
  }
}
