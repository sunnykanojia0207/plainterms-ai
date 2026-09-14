import { describe, expect, it } from "vitest";
import { alignContents, candidatePairs, textSimilarity } from "@/lib/ai/align";
import type { ContentSection } from "@/lib/ai/content";

function section(id: string, text: string): ContentSection {
  return { id, title: id, pageNumber: 1, text };
}

describe("section alignment", () => {
  it("marks identical sections same so they never reach the model", () => {
    const pairs = alignContents(
      [section("a", "Same text here."), section("b", "Changed text here.")],
      [section("a", "Same text here."), section("b", "Changed text there.")],
    );
    expect(pairs.map((pair) => pair.status)).toEqual(["same", "candidate"]);
    expect(pairs[0]?.similarity).toBe(1);
    expect(pairs[1]?.similarity).toBeLessThan(1);
  });

  it("detects added and removed sections", () => {
    const pairs = alignContents(
      [section("a", "Kept."), section("gone", "Old provision.")],
      [section("a", "Kept."), section("new", "New provision.")],
    );
    expect(pairs.map((pair) => [pair.sectionId, pair.status])).toEqual([
      ["a", "same"],
      ["gone", "removed"],
      ["new", "added"],
    ]);
  });

  it("keeps left order, then additions", () => {
    const pairs = alignContents(
      [section("b", "B1."), section("a", "A1.")],
      [section("a", "A1."), section("b", "B1."), section("c", "C1.")],
    );
    expect(pairs.map((pair) => pair.sectionId)).toEqual(["b", "a", "c"]);
  });

  it("exposes only non-identical pairs as model candidates", () => {
    const pairs = alignContents(
      [section("a", "Same."), section("b", "One."), section("c", "Old.")],
      [section("a", "Same."), section("b", "Two."), section("d", "New.")],
    );
    expect(candidatePairs(pairs).map((pair) => pair.sectionId)).toEqual(["b", "c", "d"]);
  });
});

describe("textSimilarity", () => {
  it("scores identical texts 1 and unrelated texts low", () => {
    expect(textSimilarity("net fifteen days", "net fifteen days")).toBe(1);
    expect(textSimilarity("net fifteen days", "arbitration in Delaware")).toBeLessThan(0.5);
  });
});
