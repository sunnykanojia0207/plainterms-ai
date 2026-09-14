/**
 * Fixed-window rate limiting over an injected timestamp store.
 * Pure logic (testable); production wires one module-level Map in
 * middleware.ts. Per-instance memory: correct on long-lived servers,
 * approximate on serverless (documented in ARCHITECTURE.md).
 */

export interface RateLimitBudget {
  /** Window length in milliseconds. */
  readonly windowMs: number;
  /** Requests allowed per window per key. */
  readonly maxRequests: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetMs: number;
}

/** API default: 60 requests per minute per client. */
export const DEFAULT_BUDGET: RateLimitBudget = {
  windowMs: 60_000,
  maxRequests: 60,
};

/** Uploads are heavier: 10 per minute per client. */
export const UPLOAD_BUDGET: RateLimitBudget = {
  windowMs: 60_000,
  maxRequests: 10,
};

export function checkRateLimit(
  store: Map<string, number[]>,
  key: string,
  now: number,
  budget: RateLimitBudget,
): RateLimitResult {
  const cutoff = now - budget.windowMs;
  const hits = (store.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
  if (hits.length >= budget.maxRequests) {
    const oldest = hits[0] ?? now;
    return { allowed: false, remaining: 0, resetMs: oldest + budget.windowMs - now };
  }
  hits.push(now);
  store.set(key, hits);
  return {
    allowed: true,
    remaining: budget.maxRequests - hits.length,
    resetMs: budget.windowMs,
  };
}

export function budgetForPath(pathname: string, method: string): RateLimitBudget {
  if (pathname === "/api/documents" && method === "POST") {
    return UPLOAD_BUDGET;
  }
  return DEFAULT_BUDGET;
}

export function clientKey(forwardedFor: string | null): string {
  const first = (forwardedFor ?? "").split(",")[0]?.trim();
  return first === "" || first === undefined ? "unknown" : first;
}
