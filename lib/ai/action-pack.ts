/**
 * Action Pack orchestrator: reuses the validated analysis bundle (never
 * re-extracts), generates preparation items with one structured call,
 * enforces evidence per item (citation-or-silence), and caches by
 * document + version + prompts + model.
 */
import "server-only";
import { actionPackCacheKey, cacheGet, getOrCompute } from "@/lib/ai/cache";
import { AI_CONFIG } from "@/lib/ai/config";
import { contentFromFixture, type DocumentContent } from "@/lib/ai/content";
import { validateEvidence } from "@/lib/ai/evidence";
import { generateStructured } from "@/lib/ai/gemini-client";
import { buildActionPackPrompt } from "@/lib/ai/action-pack-prompts";
import {
  ACTION_PACK_RESPONSE_SCHEMA,
  actionPackResponseSchema,
  type ActionPackEvidenceAI,
  type ActionPackItemAI,
} from "@/lib/ai/action-pack-schemas";
import { analyzeFull } from "@/lib/ai/analyze";
import { logger } from "@/lib/privacy/log";

export interface ActionPackDescriptor {
  readonly documentId: string;
  readonly title: string;
  readonly fixtureId: string;
  readonly version: number;
}

export interface ActionPackBundle {
  readonly documentId: string;
  readonly cached: boolean;
  readonly model: string;
  readonly promptVersion: string;
  readonly items: readonly ActionPackItemAI[];
  readonly dropped: number;
}

function checkEvidence(evidence: ActionPackEvidenceAI, content: DocumentContent): boolean {
  return validateEvidence({ sectionId: evidence.sectionId, quote: evidence.quote }, content).ok;
}

export async function buildActionPack(descriptor: ActionPackDescriptor): Promise<ActionPackBundle> {
  const key = actionPackCacheKey({
    documentId: descriptor.documentId,
    version: descriptor.version,
  });
  const hit = cacheGet<ActionPackBundle>(key);
  if (hit !== null) {
    logger.info("Action Pack cache hit", { documentId: descriptor.documentId });
    return { ...hit, cached: true };
  }

  return getOrCompute(key, async () => {
    // Reuse validated analysis — the model synthesizes, never re-extracts.
    const analysis = await analyzeFull(descriptor);
    const content = contentFromFixture(
      descriptor.documentId,
      descriptor.title,
      descriptor.fixtureId,
    );
    const prompt = buildActionPackPrompt({
      documentTitle: descriptor.title,
      summaryPoints: [...analysis.summary.points],
      clauses: [...analysis.clauses],
      obligations: [...analysis.obligations],
      dates: [...analysis.dates],
      concerns: [...analysis.concerns],
      content,
    });

    const result = await generateStructured({
      feature: "action-pack",
      promptVersion: prompt.version,
      systemInstruction: prompt.systemInstruction,
      userPrompt: prompt.userPrompt,
      responseSchema: ACTION_PACK_RESPONSE_SCHEMA as unknown as Record<string, unknown>,
      schema: actionPackResponseSchema,
    });

    const kept: ActionPackItemAI[] = [];
    let dropped = 0;
    for (const item of result.data.items) {
      if (item.evidence === null || checkEvidence(item.evidence, content)) {
        kept.push(item);
      } else {
        dropped += 1;
      }
    }
    if (dropped > 0) {
      logger.info("Action Pack items dropped for missing evidence", {
        documentId: descriptor.documentId,
        dropped,
      });
    }

    return {
      documentId: descriptor.documentId,
      cached: false,
      model: AI_CONFIG.model,
      promptVersion: prompt.version,
      items: kept,
      dropped,
    };
  });
}
