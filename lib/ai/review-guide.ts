/**
 * Review Guide orchestrator: reuses the validated analysis bundle and, when
 * a second document is provided, the existing comparison engine (never a
 * parallel implementation). One structured call synthesizes preparation
 * items; evidence is validated per owning document; invalid items drop.
 */
import "server-only";
import { cacheGet, getOrCompute, reviewGuideCacheKey } from "@/lib/ai/cache";
import { AI_CONFIG } from "@/lib/ai/config";
import { compareDocuments, type CompareDescriptor } from "@/lib/ai/compare";
import { contentFromFixture, type DocumentContent } from "@/lib/ai/content";
import { validateEvidence } from "@/lib/ai/evidence";
import { generateStructured } from "@/lib/ai/gemini-client";
import { buildReviewGuidePrompt } from "@/lib/ai/review-guide-prompts";
import {
  REVIEW_GUIDE_RESPONSE_SCHEMA,
  reviewGuideResponseSchema,
  type ReviewGuideEvidenceAI,
  type ReviewGuideItemAI,
} from "@/lib/ai/review-guide-schemas";
import { analyzeFull, type AnalysisDescriptor } from "@/lib/ai/analyze";
import type { ComparisonChangeAI, SilenceFindingAI } from "@/lib/ai/comparison-schemas";
import { logger } from "@/lib/privacy/log";

export interface ReviewGuideDescriptor extends AnalysisDescriptor {
  readonly compareWith?: CompareDescriptor | null;
}

export interface ReviewGuideBundle {
  readonly documentId: string;
  readonly compareDocumentId: string | null;
  readonly cached: boolean;
  readonly model: string;
  readonly promptVersion: string;
  readonly items: readonly ReviewGuideItemAI[];
  readonly dropped: number;
}

function checkEvidence(
  evidence: ReviewGuideEvidenceAI,
  contents: ReadonlyMap<string, DocumentContent>,
): boolean {
  const content = contents.get(evidence.documentId);
  if (content === undefined) {
    return false;
  }
  return validateEvidence({ sectionId: evidence.sectionId, quote: evidence.quote }, content).ok;
}

export async function buildReviewGuide(
  descriptor: ReviewGuideDescriptor,
): Promise<ReviewGuideBundle> {
  const compare = descriptor.compareWith ?? null;
  const key = reviewGuideCacheKey({
    documentId: descriptor.documentId,
    version: descriptor.version,
    compareDocumentId: compare?.documentId ?? null,
    compareVersion: compare?.version ?? null,
  });
  const hit = cacheGet<ReviewGuideBundle>(key);
  if (hit !== null) {
    logger.info("Review Guide cache hit", { documentId: descriptor.documentId });
    return { ...hit, cached: true };
  }

  return getOrCompute(key, async () => {
    const analysis = await analyzeFull(descriptor);
    const content = contentFromFixture(
      descriptor.documentId,
      descriptor.title,
      descriptor.fixtureId,
    );
    const contents = new Map([[descriptor.documentId, content]]);

    let changes: readonly ComparisonChangeAI[] = [];
    let silence: readonly SilenceFindingAI[] = [];
    let compareTitle: string | null = null;
    if (compare !== null) {
      const comparison = await compareDocuments(
        {
          documentId: descriptor.documentId,
          title: descriptor.title,
          fixtureId: descriptor.fixtureId,
          version: descriptor.version,
        },
        compare,
      );
      compareTitle = compare.title;
      const compared = contentFromFixture(compare.documentId, compare.title, compare.fixtureId);
      contents.set(compare.documentId, compared);
      changes = comparison.changes;
      silence = comparison.silence;
    }

    const prompt = buildReviewGuidePrompt({
      documentTitle: descriptor.title,
      summaryPoints: [...analysis.summary.points],
      clauses: [...analysis.clauses],
      concerns: [...analysis.concerns],
      changes: [...changes],
      silence: [...silence],
      compareTitle,
      content,
    });

    const result = await generateStructured({
      feature: "review-guide",
      promptVersion: prompt.version,
      systemInstruction: prompt.systemInstruction,
      userPrompt: prompt.userPrompt,
      responseSchema: REVIEW_GUIDE_RESPONSE_SCHEMA as unknown as Record<string, unknown>,
      schema: reviewGuideResponseSchema,
    });

    const kept: ReviewGuideItemAI[] = [];
    let dropped = 0;
    for (const item of result.data.items) {
      if (item.evidence === null || checkEvidence(item.evidence, contents)) {
        kept.push(item);
      } else {
        dropped += 1;
      }
    }
    if (dropped > 0) {
      logger.info("Review Guide items dropped for missing evidence", {
        documentId: descriptor.documentId,
        dropped,
      });
    }

    return {
      documentId: descriptor.documentId,
      compareDocumentId: compare?.documentId ?? null,
      cached: false,
      model: AI_CONFIG.model,
      promptVersion: prompt.version,
      items: kept,
      dropped,
    };
  });
}
