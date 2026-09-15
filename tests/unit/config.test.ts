/**
 * Central AI configuration guardrails. The output-token budget is load-
 * bearing: live-observed 2026-09-15, gemini-2.5-flash thinking (~2800
 * tokens) shares maxOutputTokens with visible output, so anything near
 * 4096 truncates full document-analysis JSON mid-string (FINISH=
 * MAX_TOKENS) and fails schema validation. The budget must fit prompt +
 * thinking + the largest structured response with headroom.
 */
import { describe, expect, it } from "vitest";
import { AI_CONFIG } from "@/lib/ai/config";

describe("AI configuration", () => {
  it("pins the model to gemini-2.5-flash", () => {
    expect(AI_CONFIG.model).toBe("gemini-2.5-flash");
  });

  it("budgets enough output tokens for thinking plus full structured JSON", () => {
    // Observed worst case: ~1600 prompt + ~2800 thinking + ~3500 visible.
    expect(AI_CONFIG.maxOutputTokens).toBe(8192);
  });

  it("keeps generation spend bounded below the model cap", () => {
    expect(AI_CONFIG.maxOutputTokens).toBeLessThanOrEqual(8192);
  });

  it("caps thinking so visible structured output cannot be starved", () => {
    // Thinking shares maxOutputTokens and varies per call (~2800, ~5000
    // observed); without a cap no fixed budget prevents truncation.
    expect(AI_CONFIG.thinkingBudget).toBe(1024);
    expect(AI_CONFIG.thinkingBudget).toBeLessThan(AI_CONFIG.maxOutputTokens);
  });

  it("keeps timeout and bounded retries intact", () => {
    expect(AI_CONFIG.requestTimeoutMs).toBe(45000);
    expect(AI_CONFIG.maxRetries).toBe(2);
    expect(AI_CONFIG.maxRepairAttempts).toBe(1);
  });
});
