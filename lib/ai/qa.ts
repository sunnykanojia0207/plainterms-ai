/**
 * Q&A orchestrator: retrieval-first context selection, one structured
 * model call, schema validation, per-document evidence filtering, and
 * classification-driven safe shapes. Cached per normalized question.
 */
import "server-only";
import { cacheGet, getOrCompute, qaCacheKey } from "@/lib/ai/cache";
import { AI_CONFIG } from "@/lib/ai/config";
import { resolveDocumentContent } from "@/lib/ai/document-content";
import type { DocumentContent } from "@/lib/ai/content";
import { validateEvidence } from "@/lib/ai/evidence";
import { generateStructured } from "@/lib/ai/gemini-client";
import { buildQAPrompt, type QAPromptInput } from "@/lib/ai/qa-prompts";
import {
  QA_RESPONSE_SCHEMA,
  documentAnswerSchema,
  type AnswerEvidenceAI,
  type DocumentAnswerAI,
} from "@/lib/ai/qa-schemas";
import {
  normalizeQuestion,
  pruneHistory,
  selectContext,
  type HistoryTurn,
} from "@/lib/ai/retrieval";
import { logger } from "@/lib/privacy/log";

export interface QADocumentDescriptor {
  readonly documentId: string;
  readonly title: string;
  readonly fixtureId: string;
  readonly version: number;
}

export interface QARequest {
  readonly documents: readonly QADocumentDescriptor[];
  readonly question: string;
  readonly sectionId?: string | null;
  readonly history?: readonly HistoryTurn[];
}

export interface QAResult {
  readonly answer: DocumentAnswerAI;
  readonly cached: boolean;
  readonly model: string;
  readonly promptVersion: string;
  readonly dropped: number;
}

const INSUFFICIENT_ANSWER =
  "I couldn't find enough information in this document to answer that reliably.";
const INSUFFICIENT_UNCERTAINTY =
  "The provided sections do not establish an answer. Consider reviewing the relevant sections or asking a qualified legal professional.";

function insufficientAnswer(): DocumentAnswerAI {
  return {
    classification: "missing-information",
    answer: INSUFFICIENT_ANSWER,
    evidence: [],
    uncertainty: INSUFFICIENT_UNCERTAINTY,
    followUps: [],
    counselQuestions: [],
    confidence: "low",
  };
}

function checkEvidence(
  evidence: AnswerEvidenceAI,
  contents: ReadonlyMap<string, DocumentContent>,
): boolean {
  // Section ids are shared across fixture versions, so ownership is decided
  // by quote containment — not by which document is checked first.
  for (const content of contents.values()) {
    const section = content.sections.find((item) => item.id === evidence.sectionId);
    if (section === undefined) {
      continue;
    }
    if (validateEvidence({ sectionId: evidence.sectionId, quote: evidence.quote }, content).ok) {
      return true;
    }
  }
  return false;
}

export async function answerQuestion(request: QARequest): Promise<QAResult> {
  const normalized = normalizeQuestion(request.question);
  const documentIds = request.documents.map((doc) => doc.documentId);
  const version = Math.max(...request.documents.map((doc) => doc.version));
  const key = qaCacheKey({
    documentIds,
    version,
    normalizedQuestion: normalized,
    sectionId: request.sectionId ?? null,
  });

  const hit = cacheGet<QAResult>(key);
  if (hit !== null) {
    logger.info("Q&A cache hit", { documentIds: documentIds.join("+") });
    return { ...hit, cached: true };
  }

  return getOrCompute(key, async () => {
    const contents = new Map<string, DocumentContent>();
    for (const descriptor of request.documents) {
      contents.set(descriptor.documentId, resolveDocumentContent(descriptor));
    }
    const primary = [...contents.values()][0];
    if (primary === undefined) {
      throw new Error("At least one document is required.");
    }

    // Retrieval-first: rank within each document, then merge.
    const selectedSections = new Map<string, DocumentContent["sections"][number]>();
    for (const content of contents.values()) {
      const selection = selectContext(request.question, content.sections, {
        selectedSectionId:
          content.documentId === primary.documentId ? (request.sectionId ?? null) : null,
      });
      for (const section of selection.sections) {
        if (!selectedSections.has(section.id)) {
          selectedSections.set(section.id, section);
        }
      }
    }

    const selectedSection =
      request.sectionId == null
        ? null
        : (selectedSections.get(request.sectionId) ??
          primary.sections.find((section) => section.id === request.sectionId) ??
          null);

    const promptInput: QAPromptInput = {
      documentTitle: request.documents.map((doc) => doc.title).join(" / "),
      documentType: "service-agreement",
      versionLabel:
        request.documents.length > 1
          ? `versions ${request.documents.map((doc) => `v${doc.version}`).join(" and ")}`
          : `version ${primary.documentId}`,
      sections: [...selectedSections.values()],
      selectedSection,
      question: request.question,
      history: pruneHistory(request.history ?? []),
      multiVersion: contents.size > 1,
    };
    const prompt = buildQAPrompt(promptInput);

    const result = await generateStructured({
      feature: "question-answering",
      promptVersion: prompt.version,
      systemInstruction: prompt.systemInstruction,
      userPrompt: prompt.userPrompt,
      responseSchema: QA_RESPONSE_SCHEMA as unknown as Record<string, unknown>,
      schema: documentAnswerSchema,
    });

    const substantive =
      result.data.classification === "document-fact" ||
      result.data.classification === "document-interpretation";
    const kept = result.data.evidence.filter((evidence) => checkEvidence(evidence, contents));
    const dropped = result.data.evidence.length - kept.length;
    if (dropped > 0) {
      logger.info("Q&A evidence dropped", {
        documentIds: documentIds.join("+"),
        dropped,
      });
    }

    // Citation-or-silence: substantive answers without valid evidence
    // become the safe insufficient-information response.
    const answer: DocumentAnswerAI =
      substantive && kept.length === 0
        ? { ...insufficientAnswer(), followUps: result.data.followUps }
        : { ...result.data, evidence: kept };

    const final: QAResult = {
      answer,
      cached: false,
      model: AI_CONFIG.model,
      promptVersion: prompt.version,
      dropped,
    };
    return final;
  });
}

export { INSUFFICIENT_ANSWER };
