/**
 * Server Q&A service — answers document questions through the orchestrator
 * and maps validated answers onto the AIResponse domain object.
 */
import "server-only";
import { answerQuestion, type QARequest } from "@/lib/ai/qa";
import { contentFromFixture } from "@/lib/ai/content";
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
 * quote matching identifies the true source.
 */
function ownerOf(
  evidence: AnswerEvidenceAI,
  documents: QARequest["documents"],
  fallbackId: string,
): string {
  const quote = normalizeText(evidence.quote);
  for (const doc of documents) {
    const content = contentFromFixture(doc.documentId, doc.title, doc.fixtureId);
    const found = content.sections.some((section) => normalizeText(section.text).includes(quote));
    if (found) {
      return doc.documentId;
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
    const citations = answer.evidence.map((evidence, index) =>
      toCitation(evidence, ownerOf(evidence, input.documents, fallbackId), index),
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
