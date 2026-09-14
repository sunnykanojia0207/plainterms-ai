import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_META,
  FINDING_FLAG_LABELS,
  INFORMATION_LAYER_META,
  NOT_LEGAL_ADVICE_NOTICE,
  NO_CONCERNS_COPY,
  SEVERITY_META,
} from "@/lib/domain/vocabulary";

const BANNED_PHRASES = ["dangerous", "illegal", "you will lose", "guaranteed", "definitely sign"];

describe("severity vocabulary", () => {
  it("defines all five levels with human labels", () => {
    expect(Object.keys(SEVERITY_META).sort()).toEqual([
      "critical",
      "neutral",
      "obligation",
      "potential-concern",
      "worth-reviewing",
    ]);
    for (const meta of Object.values(SEVERITY_META)) {
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
    }
  });

  it("never uses alarming or conclusive legal language", () => {
    const copy = [
      ...Object.values(SEVERITY_META).flatMap((meta) => [meta.label, meta.description]),
      ...Object.values(FINDING_FLAG_LABELS),
      NO_CONCERNS_COPY,
    ]
      .join(" ")
      .toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      expect(copy).not.toContain(phrase);
    }
  });

  it("words the no-concerns state as a neutral observation", () => {
    expect(NO_CONCERNS_COPY).toMatch(/no potential concerns/i);
    expect(NO_CONCERNS_COPY.toLowerCase()).not.toContain("safe");
    expect(NO_CONCERNS_COPY.toLowerCase()).not.toContain("clear");
  });
});

describe("confidence vocabulary", () => {
  it("defines qualitative levels with uncertainty wording", () => {
    expect(Object.keys(CONFIDENCE_META).sort()).toEqual(["high", "low", "moderate", "very-high"]);
    expect(CONFIDENCE_META.low.description).toMatch(/verify carefully/i);
    expect(CONFIDENCE_META["very-high"].description).toMatch(/explicitly/i);
  });
});

describe("information layers", () => {
  it("defines five non-interchangeable layers with lead-ins", () => {
    expect(Object.keys(INFORMATION_LAYER_META).sort()).toEqual([
      "ai-interpretation",
      "document-fact",
      "general-information",
      "potential-option",
      "question-for-counsel",
    ]);
    expect(INFORMATION_LAYER_META["document-fact"].leadIn).toMatch(/document states/i);
  });
});

describe("safety notice", () => {
  it("states the product is not legal advice", () => {
    expect(NOT_LEGAL_ADVICE_NOTICE.toLowerCase()).toContain("not legal advice");
  });
});
