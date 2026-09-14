/**
 * AI error taxonomy. Messages are safe for API responses (no content,
 * no prompts, no keys). Categories drive HTTP mapping + retry decisions.
 */
export class AIError extends Error {
  readonly category: string;
  readonly requestId: string;

  constructor(category: string, requestId: string, message: string) {
    super(message);
    this.name = "AIError";
    this.category = category;
    this.requestId = requestId;
  }
}

/** No API key configured — the unavailable UI state, not a failure. */
export class AIUnavailableError extends AIError {
  constructor(requestId: string) {
    super("unavailable", requestId, "AI review is temporarily unavailable.");
    this.name = "AIUnavailableError";
  }
}

/** A single request exceeded the configured timeout. Retryable. */
export class AITimeoutError extends AIError {
  constructor(requestId: string, timeoutMs: number) {
    super("timeout", requestId, `The AI request exceeded ${Math.round(timeoutMs / 1000)} seconds.`);
    this.name = "AITimeoutError";
  }
}

/** Network/5xx/rate-limit/safety-block. Retryable within bounds. */
export class AITransientError extends AIError {
  constructor(requestId: string) {
    // User-facing message is static by construction: provider detail
    // (codes, URLs, request IDs) must never reach API responses or UI.
    super("transient", requestId, "The AI request didn't complete. Your document is untouched.");
    this.name = "AITransientError";
  }
}

/** Output failed schema validation (including after repair). Not retried further. */
export class AIValidationError extends AIError {
  constructor(requestId: string) {
    // Static by construction: schema paths stay in server logs, not UI.
    super("validation", requestId, "The AI response didn't pass validation. Nothing was lost.");
    this.name = "AIValidationError";
  }
}
