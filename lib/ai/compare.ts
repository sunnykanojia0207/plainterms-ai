/**
 * Comparison orchestrator: deterministic alignment first, Gemini judges
 * meaning second. Only non-identical sections reach the model; identical
 * sections are counted, never reported. Evidence is validated per version
 * (citation-or-silence); invalid findings are dropped, never shown.
 */
import "server-only";
import { comparisonCacheKey, cacheGet, getOrCompute } from "@/lib/ai/cache";
import { AI_CONFIG } from "@/lib/ai/config";
import { alignContents, candidatePairs } from "@/lib/ai/align";
import type { DocumentContent } from "@/lib/ai/content";
import { resolveDocumentContent } from "@/lib/ai/document-content";
import { validateEvidence } from "@/lib/ai/evidence";
import { generateStructured } from "@/lib/ai/gemini-client";
import { buildComparisonPrompt } from "@/lib/ai/comparison-prompts";
import {
  COMPARISON_RESPONSE_SCHEMA,
  comparisonResultSchema,
  type ComparisonChangeAI,
  type ComparisonEvidenceAI,
  type SilenceFindingAI,
} from "@/lib/ai/comparison-schemas";
import { logger } from "@/lib/privacy/log";

export interface CompareDescriptor {
  readonly documentId: string;
  readonly title: string;
  readonly fixtureId: string;
  readonly version: number;
}

export interface CompareBundle {
  readonly comparisonId: string;
  readonly leftDocumentId: string;
  readonly rightDocumentId: string;
  readonly cached: boolean;
  readonly model: string;
  readonly promptVersion: string;
  readonly summary: string;
  readonly changes: readonly ComparisonChangeAI[];
  readonly silence: readonly SilenceFindingAI[];
  /** Titles of sections identical in both versions. Counted, not reported. */
  readonly unchanged: readonly string[];
  readonly verdict: string;
  readonly verdictDrivers: readonly string[];
  readonly dropped: {
    readonly changes: number;
    readonly silence: number;
  };
}

function checkEvidence(
  evidence: ComparisonEvidenceAI,
  left: DocumentContent,
  right: DocumentContent,
): boolean {
  const content = evidence.version === "v1" ? left : right;
  return validateEvidence({ sectionId: evidence.sectionId, quote: evidence.quote }, content).ok;
}

function filterChanges(
  changes: readonly ComparisonChangeAI[],
  left: DocumentContent,
  right: DocumentContent,
): { readonly kept: readonly ComparisonChangeAI[]; readonly dropped: number } {
  const kept: ComparisonChangeAI[] = [];
  let dropped = 0;
  for (const change of changes) {
    const leftOk = change.leftEvidence === null || checkEvidence(change.leftEvidence, left, right);
    const rightOk =
      change.rightEvidence === null || checkEvidence(change.rightEvidence, left, right);
    if (leftOk && rightOk) {
      kept.push(change);
    } else {
      dropped += 1;
    }
  }
  return { kept, dropped };
}

function filterSilence(
  findings: readonly SilenceFindingAI[],
  left: DocumentContent,
  right: DocumentContent,
): { readonly kept: readonly SilenceFindingAI[]; readonly dropped: number } {
  const kept: SilenceFindingAI[] = [];
  let dropped = 0;
  for (const finding of findings) {
    const leftOk = checkEvidence(finding.leftEvidence, left, right);
    const rightOk =
      finding.rightEvidence === null || checkEvidence(finding.rightEvidence, left, right);
    if (leftOk && rightOk) {
      kept.push(finding);
    } else {
      dropped += 1;
    }
  }
  return { kept, dropped };
}

export async function compareDocuments(
  leftDescriptor: CompareDescriptor,
  rightDescriptor: CompareDescriptor,
): Promise<CompareBundle> {
  const comparisonId = `cmp-${leftDescriptor.documentId}-${rightDescriptor.documentId}`;
  const key = comparisonCacheKey({
    leftDocumentId: leftDescriptor.documentId,
    leftVersion: leftDescriptor.version,
    rightDocumentId: rightDescriptor.documentId,
    rightVersion: rightDescriptor.version,
  });

  const hit = cacheGet<CompareBundle>(key);
  if (hit !== null) {
    logger.info("Comparison cache hit", {
      leftDocumentId: leftDescriptor.documentId,
      rightDocumentId: rightDescriptor.documentId,
    });
    return { ...hit, cached: true };
  }

  return getOrCompute(key, async () => {
    const left = resolveDocumentContent(leftDescriptor);
    const right = resolveDocumentContent(rightDescriptor);
    const pairs = alignContents(left.sections, right.sections);
    const unchanged = pairs.filter((pair) => pair.status === "same").map((pair) => pair.title);
    const candidates = candidatePairs(pairs);

    if (candidates.length === 0) {
      const identical: CompareBundle = {
        comparisonId,
        leftDocumentId: leftDescriptor.documentId,
        rightDocumentId: rightDescriptor.documentId,
        cached: false,
        model: AI_CONFIG.model,
        promptVersion: AI_CONFIG.promptVersions.comparison,
        summary: `The two versions are identical across all ${pairs.length} sections.`,
        changes: [],
        silence: [],
        unchanged,
        verdict: "Neither version is more or less favorable — they match exactly.",
        verdictDrivers: [],
        dropped: { changes: 0, silence: 0 },
      };
      return identical;
    }

    const prompt = buildComparisonPrompt({ left, right, pairs });
    const result = await generateStructured({
      feature: "comparison",
      promptVersion: prompt.version,
      systemInstruction: prompt.systemInstruction,
      userPrompt: prompt.userPrompt,
      responseSchema: COMPARISON_RESPONSE_SCHEMA as unknown as Record<string, unknown>,
      schema: comparisonResultSchema,
    });

    const changes = filterChanges(result.data.changes, left, right);
    const silence = filterSilence(result.data.silence, left, right);
    const droppedTotal = changes.dropped + silence.dropped;
    if (droppedTotal > 0) {
      logger.info("Comparison findings dropped for missing evidence", {
        leftDocumentId: leftDescriptor.documentId,
        rightDocumentId: rightDescriptor.documentId,
        dropped: droppedTotal,
      });
    }

    const bundle: CompareBundle = {
      comparisonId,
      leftDocumentId: leftDescriptor.documentId,
      rightDocumentId: rightDescriptor.documentId,
      cached: false,
      model: AI_CONFIG.model,
      promptVersion: AI_CONFIG.promptVersions.comparison,
      summary: result.data.summary,
      changes: changes.kept,
      silence: silence.kept,
      unchanged,
      verdict: result.data.verdict,
      verdictDrivers: result.data.verdictDrivers,
      dropped: { changes: changes.dropped, silence: silence.dropped },
    };
    return bundle;
  });
}
