import { describe, expect, it } from "vitest";
import { normalizeQuestion, pruneHistory, rankSections, selectContext } from "@/lib/ai/retrieval";
import { contentFromFixture } from "@/lib/ai/content";
import { FIXTURE_V1_ID } from "@/lib/documents/fixture-v1";

const content = contentFromFixture("v1", "Agreement v1", FIXTURE_V1_ID);

describe("section ranking", () => {
  it("ranks the payment section first for a payment question", () => {
    const ranked = rankSections("What are my payment terms?", content.sections);
    expect(ranked[0]?.section.id).toBe("sec-payment");
  });

  it("ranks termination first for a termination question", () => {
    const ranked = rankSections(
      "When can either party terminate this agreement?",
      content.sections,
    );
    expect(ranked[0]?.section.id).toBe("sec-termination");
  });
});

describe("context selection", () => {
  it("always includes the user-selected section first", () => {
    const selection = selectContext("What are my payment terms?", content.sections, {
      selectedSectionId: "sec-restrictions",
    });
    expect(selection.sections[0]?.id).toBe("sec-restrictions");
    expect(selection.sections.length).toBeLessThanOrEqual(4);
  });

  it("caps sections and characters with a truncation flag", () => {
    const full = selectContext("Tell me everything in this contract?", content.sections);
    expect(full.sections.length).toBeLessThanOrEqual(4);
    expect(full.truncated).toBe(false);
    const tiny = selectContext("Tell me everything in this contract?", content.sections, {
      maxSections: 2,
      maxChars: 50,
    });
    expect(tiny.sections).toHaveLength(1);
    expect(tiny.truncated).toBe(true);
    expect(tiny.totalSections).toBe(content.sections.length);
  });
});

describe("normalizeQuestion", () => {
  it("treats cosmetic variants as the same question", () => {
    expect(normalizeQuestion("  What are my payment terms?  ")).toBe(
      normalizeQuestion("what are my PAYMENT terms"),
    );
  });
});

describe("pruneHistory", () => {
  it("keeps the last three turns with trimmed summaries", () => {
    const turns = Array.from({ length: 5 }, (_, index) => ({
      question: `Question ${index} ${"x".repeat(300)}`,
      answerSummary: `Answer ${index} ${"y".repeat(500)}`,
    }));
    const pruned = pruneHistory(turns);
    expect(pruned).toHaveLength(3);
    expect(pruned[0]?.question).toContain("Question 2");
    for (const turn of pruned) {
      expect(turn.question.length).toBeLessThanOrEqual(200);
      expect(turn.answerSummary.length).toBeLessThanOrEqual(300);
    }
  });
});
