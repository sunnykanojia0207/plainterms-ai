/**
 * Provider failure simulation (mocked SDK, no network, no key needed):
 * timeouts, rate limits, and repair bounds at the client layer.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { generateStructured, type StructuredRequest } from "@/lib/ai/gemini-client";
import { AI_CONFIG } from "@/lib/ai/config";
import { AITimeoutError, AITransientError, AIValidationError } from "@/lib/ai/errors";

const { mockGenerate } = vi.hoisted(() => ({ mockGenerate: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerate };
  },
}));

const schema = z.object({ ok: z.boolean() }).strict();

function request(): StructuredRequest<{ ok: boolean }> {
  return {
    feature: "probe",
    promptVersion: "probe-v1",
    systemInstruction: "Return JSON only.",
    userPrompt: '{"probe": true}',
    responseSchema: { type: "object" },
    schema,
  };
}

describe("provider failure simulation", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("times out a hung request within the configured budget", async () => {
    mockGenerate.mockImplementation(() => new Promise(() => {}));
    const pending = generateStructured(request());
    // Attach the assertion BEFORE advancing: otherwise the rejection fires
    // during the advance with no handler yet (unhandled rejection).
    const assertion = expect(pending).rejects.toBeInstanceOf(AITimeoutError);
    // Three attempts (45s each) plus backoffs, in fake time.
    await vi.advanceTimersByTimeAsync(200000);
    await assertion;
  });

  it("retries rate limits and succeeds", async () => {
    mockGenerate
      .mockRejectedValueOnce(new Error("429 RESOURCE_EXHAUSTED: quota exceeded"))
      .mockResolvedValue({ text: JSON.stringify({ ok: true }) });
    const pending = generateStructured(request());
    await vi.advanceTimersByTimeAsync(600);
    const result = await pending;
    expect(result.data).toEqual({ ok: true });
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it("surfaces persistent 5xx failures without endless retries", async () => {
    mockGenerate.mockRejectedValue(new Error("500 Internal Server Error"));
    const pending = generateStructured(request());
    const assertion = expect(pending).rejects.toBeInstanceOf(AITransientError);
    await vi.advanceTimersByTimeAsync(200000);
    await assertion;
    // Initial attempt + 2 configured retries.
    expect(mockGenerate.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it("repairs malformed output once, then fails safely", async () => {
    // Real timers: this path needs none (immediate mock responses).
    vi.useRealTimers();
    mockGenerate.mockResolvedValue({ text: "{broken" });
    const pending = generateStructured(request());
    await expect(pending).rejects.toBeInstanceOf(AIValidationError);
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it("propagates the centralized model budget to the provider call", async () => {
    vi.useRealTimers();
    mockGenerate.mockResolvedValue({ text: JSON.stringify({ ok: true }) });
    await generateStructured(request());
    const call = mockGenerate.mock.calls[0]?.[0] as {
      model: string;
      config: {
        temperature: number;
        maxOutputTokens: number;
        thinkingConfig: { thinkingBudget: number };
      };
    };
    expect(call.model).toBe(AI_CONFIG.model);
    expect(call.config.temperature).toBe(AI_CONFIG.temperature);
    expect(call.config.maxOutputTokens).toBe(AI_CONFIG.maxOutputTokens);
    expect(call.config.thinkingConfig.thinkingBudget).toBe(AI_CONFIG.thinkingBudget);
  });
});
