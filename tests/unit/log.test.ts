import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/privacy/log";

describe("privacy-safe logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("strips keys that resemble document content, prompts, or secrets", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("Upload finished", {
      documentText: "§7.2 confidential terms",
      apiKey: "sk-secret",
      pageCount: 17,
    });
    expect(spy).toHaveBeenCalledOnce();
    const payload = spy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("documentText");
    expect(payload).not.toHaveProperty("apiKey");
    expect(payload).toHaveProperty("pageCount", 17);
  });

  it("truncates long strings so passages cannot leak through safe keys", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const longNote = `note:${"x".repeat(500)}`;
    logger.error("Failure", { note: longNote });
    const payload = spy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(String(payload["note"]).length).toBeLessThan(longNote.length);
  });

  it("never writes document content in debug output", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("Failure", {
      answer: "The client may terminate immediately.",
      route: "/ask",
    });
    const serialized = JSON.stringify(spy.mock.calls[0]?.[0]);
    expect(serialized).not.toContain("terminate immediately");
    expect(serialized).toContain("/ask");
  });
});
