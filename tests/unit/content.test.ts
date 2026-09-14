import { describe, expect, it } from "vitest";
import { contentFromFixture, contentToPromptText } from "@/lib/ai/content";
import { FIXTURE_ID } from "@/lib/documents/fixture";

describe("document content builder", () => {
  it("adapts the fixture into addressable sections", () => {
    const content = contentFromFixture("doc-1", "Client agreement", FIXTURE_ID);
    expect(content.documentId).toBe("doc-1");
    expect(content.sections.length).toBeGreaterThan(5);
    for (const section of content.sections) {
      expect(section.id.length).toBeGreaterThan(0);
      expect(section.text.length).toBeGreaterThan(0);
      expect(section.pageNumber).toBeGreaterThan(0);
    }
    const payment = content.sections.find((section) => section.id === "sec-payment");
    expect(payment?.text).toContain("$4,500");
  });

  it("rejects unknown fixture sources", () => {
    expect(() => contentFromFixture("doc-1", "X", "parse-my-pdf")).toThrow(/unknown fixture/i);
  });

  it("renders section markers the evidence validator can resolve", () => {
    const content = contentFromFixture("doc-1", "Client agreement", FIXTURE_ID);
    const text = contentToPromptText(content);
    expect(text).toContain('[SECTION id="sec-payment"');
    expect(text).toContain("page=2");
  });
});
