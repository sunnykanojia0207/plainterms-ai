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
  /**
   * Output-token budget for one model call. Live-observed 2026-09-15 against
   * gemini-2.5-flash: the model's thinking tokens (~2800) share this budget
   * with visible output, so 4096 truncated full document-analysis JSON
   * mid-string (FINISH=MAX_TOKENS) and failed schema validation. A complete
   * analysis needs ~1600 prompt + ~2800 thinking + ~3500 visible tokens, so
   * 8192 (the provider default, far below the 65536 model cap) fits the
   * worst-case structured workloads with headroom but no unbounded spend.
   */
  maxOutputTokens: 8192,
  /**
   * Thinking-token cap for one model call. Live-observed 2026-09-15 against
   * gemini-2.5-flash: thinking shares maxOutputTokens with visible output
   * and varies wildly per call (~2800, then ~5000), so no fixed output
   * budget alone prevents truncation. Capping thinking at 1024 reserves the
   * bulk of the budget for visible structured JSON while keeping light
   * reasoning for extraction; unbounded thinking is pure cost with no
   * quality benefit for these schema-constrained tasks.
   */
  thinkingBudget: 1024,
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
