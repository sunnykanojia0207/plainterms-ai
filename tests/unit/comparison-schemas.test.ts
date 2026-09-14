import { describe, expect, it } from "vitest";
import { COMPARISON_RESPONSE_SCHEMA, comparisonResultSchema } from "@/lib/ai/comparison-schemas";

const EVIDENCE_V1 = {
  version: "v1",
  sectionId: "sec-payment",
  sectionTitle: "3. Payment Terms",
  quote:
    "Invoices are payable net fifteen (15) days from receipt. Late payments bear interest of 1.5% per month.",
  pageNumber: 2,
};

const EVIDENCE_V2 = {
  version: "v2",
  sectionId: "sec-payment",
  sectionTitle: "3. Payment Terms",
  quote:
    "Invoices are payable net thirty (30) days from receipt. This Agreement does not provide for a late-payment fee or interest on overdue amounts.",
  pageNumber: 2,
};

function change(overrides: Record<string, unknown> = {}) {
  return {
    category: "payment",
    kind: "changed",
    materiality: "material",
    favors: "client",
    title: "Payment terms",
    whatChanged: "The payment window moved from net 15 to net 30.",
    whyItMatters: "The freelancer waits longer to be paid.",
    implication: "Cash flow arrives up to 15 days later.",
    questionToConsider: "Was the longer window intentional?",
    nextStep: "Consider asking for net-15 or a late fee.",
    confidence: "high",
    leftEvidence: EVIDENCE_V1,
    rightEvidence: EVIDENCE_V2,
    ...overrides,
  };
}

const VALID = {
  summary: "PlainTerms identified 2 potentially important changes between the two versions.",
  changes: [change()],
  silence: [
    {
      state: "removed",
      subject: "Late-payment interest",
      leftEvidence: EVIDENCE_V1,
      rightEvidence: null,
      whatWeKnow: "V1 charged 1.5% monthly interest on late payment.",
      whatRemainsUncertain: null,
      questionToConsider: "Was the interest removed intentionally?",
      confidence: "high",
    },
  ],
  verdict: "Version 2 shifts payment timing risk to the freelancer.",
  verdictDrivers: ["Net 15 to net 30"],
};

describe("comparison schemas", () => {
  it("accepts a well-formed comparison result", () => {
    expect(() => comparisonResultSchema.parse(VALID)).not.toThrow();
  });

  it("rejects changed findings missing an evidence side", () => {
    expect(() =>
      comparisonResultSchema.parse({
        ...VALID,
        changes: [change({ rightEvidence: null })],
      }),
    ).toThrow(/both left and right evidence/i);
  });

  it("rejects added findings without right evidence and wrong version tags", () => {
    expect(() =>
      comparisonResultSchema.parse({
        ...VALID,
        changes: [change({ kind: "added", rightEvidence: null })],
      }),
    ).toThrow();
    expect(() =>
      comparisonResultSchema.parse({
        ...VALID,
        changes: [change({ leftEvidence: { ...EVIDENCE_V1, version: "v2" } })],
      }),
    ).toThrow(/v1/i);
  });

  it("rejects unexpected fields and banned severity language stays out of schema", () => {
    expect(() => comparisonResultSchema.parse({ ...VALID, hacked: true })).toThrow();
  });

  it("keeps the transport schema aligned with required keys", () => {
    expect(COMPARISON_RESPONSE_SCHEMA.required).toEqual(
      expect.arrayContaining(["summary", "changes", "silence", "verdict", "verdictDrivers"]),
    );
  });
});
