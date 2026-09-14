/**
 * Analysis cache — keyed by document + version + prompts + model.
 * Same unchanged document never triggers a repeat Gemini call.
 * In-memory for this milestone (single server); a shared store replaces
 * this module when the app scales horizontally. Validated objects only.
 */
import "server-only";
import { AI_CONFIG } from "@/lib/ai/config";

interface CacheEntry<T> {
  readonly value: T;
  readonly storedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

export function cacheKey(parts: { readonly documentId: string; readonly version: number }): string {
  return [
    parts.documentId,
    `v${parts.version}`,
    AI_CONFIG.promptVersions.documentAnalysis,
    AI_CONFIG.promptVersions.clauseIntelligence,
    AI_CONFIG.model,
  ].join("|");
}

/** Comparison cache key: both documents + versions + comparison prompt + model. */
export function comparisonCacheKey(parts: {
  readonly leftDocumentId: string;
  readonly leftVersion: number;
  readonly rightDocumentId: string;
  readonly rightVersion: number;
}): string {
  return [
    parts.leftDocumentId,
    `v${parts.leftVersion}`,
    parts.rightDocumentId,
    `v${parts.rightVersion}`,
    AI_CONFIG.promptVersions.comparison,
    AI_CONFIG.model,
  ].join("|");
}

/** Q&A cache key: document + version + normalized question + section + prompt + model. */
export function qaCacheKey(parts: {
  readonly documentIds: readonly string[];
  readonly version: number;
  readonly normalizedQuestion: string;
  readonly sectionId: string | null;
}): string {
  return [
    [...parts.documentIds].sort().join("+"),
    `v${parts.version}`,
    parts.normalizedQuestion,
    parts.sectionId ?? "-",
    AI_CONFIG.promptVersions.qa,
    AI_CONFIG.model,
  ].join("|");
}

/**
 * Action Pack cache key: document + version + prompt + model + the
 * analysis prompt versions it builds on (stale analysis never feeds a pack).
 */
export function actionPackCacheKey(parts: {
  readonly documentId: string;
  readonly version: number;
}): string {
  return [
    parts.documentId,
    `v${parts.version}`,
    AI_CONFIG.promptVersions.actionPack,
    AI_CONFIG.promptVersions.documentAnalysis,
    AI_CONFIG.promptVersions.clauseIntelligence,
    AI_CONFIG.model,
  ].join("|");
}

/**
 * Review Guide cache key: document + version + optional compared document
 * + prompt + model + the analysis/comparison prompt versions it builds on.
 */
export function reviewGuideCacheKey(parts: {
  readonly documentId: string;
  readonly version: number;
  readonly compareDocumentId: string | null;
  readonly compareVersion: number | null;
}): string {
  return [
    parts.documentId,
    `v${parts.version}`,
    parts.compareDocumentId ?? "-",
    parts.compareVersion === null ? "-" : `v${parts.compareVersion}`,
    AI_CONFIG.promptVersions.reviewGuide,
    AI_CONFIG.promptVersions.documentAnalysis,
    AI_CONFIG.promptVersions.comparison,
    AI_CONFIG.model,
  ].join("|");
}

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (entry === undefined) {
    return null;
  }
  if (Date.now() - entry.storedAt > AI_CONFIG.cache.ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet<T>(key: string, value: T): void {
  store.set(key, { value, storedAt: Date.now() });
  while (store.size > AI_CONFIG.cache.maxEntries) {
    const oldest = store.keys().next();
    if (oldest.done === true) {
      break;
    }
    store.delete(oldest.value);
  }
}

/** Test seam: clears all cached analyses. */
export function cacheClear(): void {
  store.clear();
  pending.clear();
}

/**
 * Returns the cached value or computes it exactly once, even under
 * concurrent callers (the five review-service methods fire together).
 * Failures are not cached and release the in-flight slot.
 */
export async function getOrCompute<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }
  const inFlight = pending.get(key) as Promise<T> | undefined;
  if (inFlight !== undefined) {
    return inFlight;
  }
  const task = compute().then(
    (value) => {
      cacheSet(key, value);
      pending.delete(key);
      return value;
    },
    (error: unknown) => {
      pending.delete(key);
      throw error;
    },
  );
  pending.set(key, task);
  return task;
}
