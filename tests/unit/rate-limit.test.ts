import { describe, expect, it } from "vitest";
import {
  DEFAULT_BUDGET,
  UPLOAD_BUDGET,
  budgetForPath,
  checkRateLimit,
  clientKey,
} from "@/lib/security/rate-limit";

describe("rate limiting", () => {
  it("allows requests within budget and blocks beyond it", () => {
    const store = new Map<string, number[]>();
    for (let index = 0; index < 60; index += 1) {
      expect(checkRateLimit(store, "ip", index * 100, DEFAULT_BUDGET).allowed).toBe(true);
    }
    const blocked = checkRateLimit(store, "ip", 6000, DEFAULT_BUDGET);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it("refills after the window passes and isolates keys", () => {
    const store = new Map<string, number[]>();
    checkRateLimit(store, "a", 0, { windowMs: 1000, maxRequests: 1 });
    expect(checkRateLimit(store, "a", 500, { windowMs: 1000, maxRequests: 1 }).allowed).toBe(false);
    expect(checkRateLimit(store, "b", 500, { windowMs: 1000, maxRequests: 1 }).allowed).toBe(true);
    expect(checkRateLimit(store, "a", 1001, { windowMs: 1000, maxRequests: 1 }).allowed).toBe(true);
  });

  it("applies the strict budget to uploads only", () => {
    expect(budgetForPath("/api/documents", "POST")).toBe(UPLOAD_BUDGET);
    expect(budgetForPath("/api/documents", "DELETE")).toBe(DEFAULT_BUDGET);
    expect(budgetForPath("/api/ask", "POST")).toBe(DEFAULT_BUDGET);
  });

  it("keys clients by first forwarded address with an unknown fallback", () => {
    expect(clientKey("1.2.3.4, 5.6.7.8")).toBe("1.2.3.4");
    expect(clientKey(null)).toBe("unknown");
    expect(clientKey("")).toBe("unknown");
  });
});
