/**
 * Server-only Gemini client. All provider contact happens here:
 * timeouts, bounded retries, one constrained validation repair, and
 * content-free observability. UI and routes must never import the SDK.
 */
import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AI_CONFIG } from "@/lib/ai/config";
import {
  AITimeoutError,
  AITransientError,
  AIUnavailableError,
  AIValidationError,
} from "@/lib/ai/errors";
import { buildRepairPrompt } from "@/lib/ai/prompts";
import { logger } from "@/lib/privacy/log";

export interface StructuredRequest<T> {
  readonly feature: string;
  readonly promptVersion: string;
  readonly systemInstruction: string;
  readonly userPrompt: string;
  readonly responseSchema: Record<string, unknown>;
  readonly schema: z.ZodType<T>;
}

export interface StructuredResult<T> {
  readonly data: T;
  readonly requestId: string;
  readonly repaired: boolean;
  readonly latencyMs: number;
}

function createRequestId(): string {
  return crypto.randomUUID();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTransient(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|5\d\d|timeout|timed out|network|fetch failed|ECONN|ETIMEDOUT|overloaded|unavailable/i.test(
    message,
  );
}

function summarizeIssues(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ")
      .slice(0, 500);
  }
  if (error instanceof SyntaxError) {
    return "Response was not valid JSON.";
  }
  return error instanceof Error ? error.message.slice(0, 200) : "Unknown error.";
}

/**
 * Generates structured output with timeout, bounded retries, and one
 * validation repair. Returns validated, typed data — never raw model text.
 */
export async function generateStructured<T>(
  request: StructuredRequest<T>,
): Promise<StructuredResult<T>> {
  const requestId = createRequestId();
  const started = Date.now();
  const apiKey = process.env.GEMINI_API_KEY ?? "";

  const baseLog = {
    requestId,
    feature: request.feature,
    model: AI_CONFIG.model,
    promptVersion: request.promptVersion,
  };

  if (apiKey === "") {
    logger.warn("AI request skipped: no API key configured", baseLog);
    throw new AIUnavailableError(requestId);
  }

  const client = new GoogleGenAI({ apiKey });

  async function attempt(systemInstruction: string, userPrompt: string): Promise<string> {
    // The loser of the race is cancelled outright so a late timeout can
    // never surface as an unhandled rejection after the call settles.
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new AITimeoutError(requestId, AI_CONFIG.requestTimeoutMs)),
        AI_CONFIG.requestTimeoutMs,
      );
    });
    try {
      const response = await Promise.race([
        client.models.generateContent({
          model: AI_CONFIG.model,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: AI_CONFIG.temperature,
            maxOutputTokens: AI_CONFIG.maxOutputTokens,
            responseMimeType: "application/json",
            responseJsonSchema: request.responseSchema,
          },
        }),
        timeout,
      ]);
      const text = response.text;
      if (typeof text !== "string" || text.trim() === "") {
        throw new AITransientError(requestId, "The model returned no usable output.");
      }
      return text;
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }

  function parse(raw: string): T {
    return request.schema.parse(JSON.parse(raw) as unknown);
  }

  let lastError: unknown = null;
  const attempts = AI_CONFIG.maxRetries + 1;
  for (let attemptIndex = 0; attemptIndex < attempts; attemptIndex += 1) {
    try {
      const raw = await attempt(request.systemInstruction, request.userPrompt);
      try {
        const data = parse(raw);
        const latencyMs = Date.now() - started;
        logger.info("AI request succeeded", {
          ...baseLog,
          latencyMs,
          status: "ok",
          validation: "passed",
        });
        return { data, requestId, repaired: false, latencyMs };
      } catch (validationError) {
        const issues = summarizeIssues(validationError);
        logger.warn("AI output failed validation; attempting repair", {
          ...baseLog,
          status: "repairing",
          validation: issues.slice(0, 120),
        });
        const repair = buildRepairPrompt(request.promptVersion, issues);
        const repairedRaw = await attempt(repair.systemInstruction, repair.userPrompt);
        try {
          const data = parse(repairedRaw);
          const latencyMs = Date.now() - started;
          logger.info("AI request succeeded after repair", {
            ...baseLog,
            latencyMs,
            status: "ok",
            validation: "repaired",
          });
          return { data, requestId, repaired: true, latencyMs };
        } catch (repairError) {
          throw new AIValidationError(requestId, summarizeIssues(repairError));
        }
      }
    } catch (error) {
      if (error instanceof AIValidationError) {
        logger.warn("AI request failed validation", {
          ...baseLog,
          status: "error",
          validation: error.message.slice(0, 120),
        });
        throw error;
      }
      lastError = error;
      const retryable = error instanceof AITimeoutError || isTransient(error);
      logger.warn("AI request attempt failed", {
        ...baseLog,
        status: "retrying",
        attempt: attemptIndex + 1,
      });
      if (!retryable || attemptIndex >= attempts - 1) {
        break;
      }
      await sleep(500 * (attemptIndex + 1));
    }
  }

  const latencyMs = Date.now() - started;
  if (lastError instanceof AITimeoutError) {
    logger.warn("AI request timed out", { ...baseLog, latencyMs, status: "error" });
    throw lastError;
  }
  logger.warn("AI request failed", { ...baseLog, latencyMs, status: "error" });
  throw new AITransientError(
    requestId,
    lastError instanceof Error ? lastError.message.slice(0, 160) : "Unknown error.",
  );
}
