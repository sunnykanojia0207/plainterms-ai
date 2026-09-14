import { describe, expect, it } from "vitest";
import { getSectionsForFixture, isKnownFixture } from "@/lib/documents/sections";
import { FIXTURE_ID } from "@/lib/documents/fixture";
import { FIXTURE_V1_ID } from "@/lib/documents/fixture-v1";

describe("fixture-aware sections", () => {
  it("resolves each fixture to its own text", () => {
    const v1 = getSectionsForFixture(FIXTURE_V1_ID, "doc-v1");
    const v2 = getSectionsForFixture(FIXTURE_ID, "doc-v2");
    const paymentV1 = v1.find((section) => section.id === "sec-payment");
    const paymentV2 = v2.find((section) => section.id === "sec-payment");
    expect(paymentV1?.paragraphs.join(" ")).toContain("fifteen (15)");
    expect(paymentV2?.paragraphs.join(" ")).toContain("thirty (30)");
    expect(paymentV1?.documentId).toBe("doc-v1");
  });

  it("falls back to current terms for unknown ids", () => {
    expect(isKnownFixture(FIXTURE_ID)).toBe(true);
    expect(isKnownFixture(FIXTURE_V1_ID)).toBe(true);
    expect(isKnownFixture("nope")).toBe(false);
    const fallback = getSectionsForFixture("nope", "doc-x");
    expect(
      fallback.find((section) => section.id === "sec-payment")?.paragraphs.join(" "),
    ).toContain("thirty (30)");
  });
});
