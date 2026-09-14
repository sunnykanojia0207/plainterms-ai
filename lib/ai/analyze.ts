/**
 * Analysis orchestrator — the two milestone services behind one cached call.
 * analyzeDocumentSection: summary + obligations + dates + concerns.
 * analyzeClauseSection: categorized clause findings.
 * analyzeFull: cached bundle served to the review UI.
 *
 * Evidence is enforced on every list (citation-or-silence); dropped counts
 * are returned for observability, never rendered as findings.
 */
import "server-only";
import { cacheGet, cacheKey, getOrCompute } from "@/lib/ai/cache";
import { AI_CONFIG } from "@/lib/ai/config";
import type { DocumentContent } from "@/lib/ai/content";
import { resolveDocumentContent } from "@/lib/ai/document-content";
import { enforceCitations } from "@/lib/ai/evidence";
import { generateStructured } from "@/lib/ai/gemini-client";
import { buildAnalysisPrompt, buildClausesPrompt } from "@/lib/ai/prompts";
import {
  CLAUSE_INTELLIGENCE_RESPONSE_SCHEMA,
  clauseIntelligenceSchema,
  DOCUMENT_ANALYSIS_RESPONSE_SCHEMA,
  documentAnalysisSchema,
  type ClauseFinding,
  type DocumentAnalysis,
  type ImportantDateAI,
  type ObligationAI,
  type PotentialConcernAI,
} from "@/lib/ai/schemas";
import { logger } from "@/lib/privacy/log";

export interface AnalysisDescriptor {
  readonly documentId: string;
  readonly title: string;
  readonly fixtureId: string;
  readonly version: number;
}

export interface AnalysisBundle {
  readonly documentId: string;
  readonly cached: boolean;
  readonly model: string;
  readonly promptVersions: {
    readonly documentAnalysis: string;
    readonly clauseIntelligence: string;
  };
  readonly summary: DocumentAnalysis["summary"];
  readonly obligations: readonly ObligationAI[];
  readonly dates: readonly ImportantDateAI[];
  readonly concerns: readonly PotentialConcernAI[];
  readonly clauses: readonly ClauseFinding[];
  readonly dropped: {
    readonly obligations: number;
    readonly dates: number;
    readonly concerns: number;
    readonly clauses: number;
  };
}

export async function analyzeDocumentSection(content: DocumentContent): Promise<DocumentAnalysis> {
  if (!AI_CONFIG.features.documentAnalysis) {
    return {
      summary: { points: [], parties: [], effectiveDate: null, areasToReview: [] },
      obligations: [],
      dates: [],
      concerns: [],
    };
  }
  const prompt = buildAnalysisPrompt(content);
  const result = await generateStructured({
    feature: "document-analysis",
    promptVersion: prompt.version,
    systemInstruction: prompt.systemInstruction,
    userPrompt: prompt.userPrompt,
    responseSchema: DOCUMENT_ANALYSIS_RESPONSE_SCHEMA as unknown as Record<string, unknown>,
    schema: documentAnalysisSchema,
  });
  return result.data;
}

export async function analyzeClauseSection(
  content: DocumentContent,
): Promise<readonly ClauseFinding[]> {
  if (!AI_CONFIG.features.clauseIntelligence) {
    return [];
  }
  const prompt = buildClausesPrompt(content);
  const result = await generateStructured({
    feature: "clause-intelligence",
    promptVersion: prompt.version,
    systemInstruction: prompt.systemInstruction,
    userPrompt: prompt.userPrompt,
    responseSchema: CLAUSE_INTELLIGENCE_RESPONSE_SCHEMA as unknown as Record<string, unknown>,
    schema: clauseIntelligenceSchema,
  });
  return result.data.clauses;
}

export async function analyzeFull(descriptor: AnalysisDescriptor): Promise<AnalysisBundle> {
  const key = cacheKey({
    documentId: descriptor.documentId,
    version: descriptor.version,
  });
  const hit = cacheGet<AnalysisBundle>(key);
  if (hit !== null) {
    logger.info("AI analysis cache hit", {
      documentId: descriptor.documentId,
    });
    return { ...hit, cached: true };
  }
  // Concurrent first calls share one computation via getOrCompute.
  return getOrCompute(key, async () => {
    const content = resolveDocumentContent(descriptor);

    const [analysis, clauses] = await Promise.all([
      analyzeDocumentSection(content),
      analyzeClauseSection(content),
    ]);

    const obligations = enforceCitations(analysis.obligations, content);
    const dates = enforceCitations(analysis.dates, content);
    const concerns = enforceCitations(analysis.concerns, content);
    const filteredClauses = enforceCitations(clauses, content);

    const droppedTotal =
      obligations.dropped + dates.dropped + concerns.dropped + filteredClauses.dropped;
    if (droppedTotal > 0) {
      logger.info("AI findings dropped for missing evidence", {
        documentId: descriptor.documentId,
        dropped: droppedTotal,
      });
    }

    const fresh: AnalysisBundle = {
      documentId: descriptor.documentId,
      cached: false,
      model: AI_CONFIG.model,
      promptVersions: { ...AI_CONFIG.promptVersions },
      summary: analysis.summary,
      obligations: obligations.kept,
      dates: dates.kept,
      concerns: concerns.kept,
      clauses: filteredClauses.kept,
      dropped: {
        obligations: obligations.dropped,
        dates: dates.dropped,
        concerns: concerns.dropped,
        clauses: filteredClauses.dropped,
      },
    };
    return fresh;
  });
}
