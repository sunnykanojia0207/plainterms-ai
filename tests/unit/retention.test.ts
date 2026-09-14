import { describe, expect, it } from "vitest";
import { RETENTION_COPY, defaultRetention } from "@/lib/privacy/retention";

describe("retention model", () => {
  it("defaults to session-only with no stored copy", () => {
    expect(defaultRetention()).toEqual({ choice: "session-only", purgeAfter: null });
  });

  it("explains both choices in plain words", () => {
    expect(RETENTION_COPY["session-only"]).toMatch(/deleted/i);
    expect(RETENTION_COPY["saved"]).toMatch(/delete anytime/i);
  });
});
