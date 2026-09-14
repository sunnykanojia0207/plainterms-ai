import { describe, expect, it } from "vitest";
import { enforceCitations, validateEvidence } from "@/lib/ai/evidence";
import { contentFromFixture } from "@/lib/ai/content";
import { FIXTURE_ID } from "@/lib/documents/fixture";

const content = contentFromFixture("doc-1", "Client agreement", FIXTURE_ID);

const GOOD_QUOTE =
  "The Client will pay the Contractor a fixed fee of $4,500 per month, invoiced on the first business day of each month.";

describe("evidence validator", () => {
  it("accepts a real quote from the cited section", () => {
    expect(validateEvidence({ sectionId: "sec-payment", quote: GOOD_QUOTE }, content)).toEqual({
      ok: true,
    });
  });

  it("rejects unknown sections", () => {
    const check = validateEvidence({ sectionId: "sec-nope", quote: GOOD_QUOTE }, content);
    expect(check.ok).toBe(false);
  });

  it("rejects quotes too short to support a finding", () => {
    expect(
      validateEvidence({ sectionId: "sec-payment", quote: "net thirty days" }, content).ok,
    ).toBe(false);
  });

  it("rejects quotes that do not appear in the cited section", () => {
    expect(
      validateEvidence(
        {
          sectionId: "sec-payment",
          quote: "The moon is made of green cheese and everyone agrees fully.",
        },
        content,
      ).ok,
    ).toBe(false);
  });

  it("normalizes whitespace and case before matching", () => {
    expect(
      validateEvidence(
        {
          sectionId: "sec-payment",
          quote:
            "  the CLIENT will pay   the contractor A FIXED FEE of $4,500 per month, invoiced on the first business day of each month. ",
        },
        content,
      ),
    ).toEqual({ ok: true });
  });
});

describe("citation-or-silence enforcement", () => {
  it("keeps evidenced findings and counts the dropped", () => {
    const result = enforceCitations(
      [
        { title: "Kept", evidence: { sectionId: "sec-payment", quote: GOOD_QUOTE } },
        { title: "Dropped", evidence: { sectionId: "sec-nope", quote: GOOD_QUOTE } },
      ],
      content,
    );
    expect(result.kept.map((finding) => finding.title)).toEqual(["Kept"]);
    expect(result.dropped).toBe(1);
  });
});
