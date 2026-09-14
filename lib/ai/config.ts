/**
 * Centralized Gemini configuration — the ONLY place model settings live.
 * Nothing outside lib/ai may reference model names, temperatures, budgets,
 * timeouts, retries, or prompt versions.
 */

export const AI_CONFIG = {
  /** Primary model for all milestone capabilities. */
  model: "gemini-2.5-flash",
  /** Low temperature: extraction and explanation must stay faithful. */
  temperature: 0.2,
  maxOutputTokens: 4096,
  /** Bounds end-to-end latency for one model call. */
  requestTimeoutMs: 45000,
  /** Transient-failure retries (initial attempt + this many retries). */
  maxRetries: 2,
  /** Single constrained repair attempt after schema validation fails. */
  maxRepairAttempts: 1,
  /** Prompt versions ride on every request for traceability. */
  promptVersions: {
    documentAnalysis: "document-analysis-v1",
    clauseIntelligence: "clause-intelligence-v1",
    comparison: "comparison-v1",
    qa: "legal-document-qa-v1",
    actionPack: "action-pack-v1",
    reviewGuide: "review-guide-v1",
  },
  /** Feature flags — all MVP capabilities exist. */
  features: {
    documentAnalysis: true,
    clauseIntelligence: true,
    comparison: true,
    qa: true,
    actionPack: true,
    reviewGuide: true,
    chat: false,
  },
  /** Analysis cache: entries and time-to-live. */
  cache: {
    maxEntries: 50,
    ttlMs: 60 * 60 * 1000,
  },
} as const;

export type AIConfig = typeof AI_CONFIG;
