import { describe, expect, it } from "vitest";
import {
  REVIEW_GUIDE_RESPONSE_SCHEMA,
  reviewGuideResponseSchema,
} from "@/lib/ai/review-guide-schemas";

const EVIDENCE = {
  documentId: "doc-1",
  sectionId: "sec-payment",
  sectionTitle: "3. Payment Terms",
  quote:
    "Invoices are payable net thirty (30) days from receipt. This Agreement does not provide for a late-payment fee or interest on overdue amounts.",
  pageNumber: 2,
};

function item(overrides: Record<string, unknown> = {}) {
  return {
    kind: "topic",
    title: "Payment timing",
    summary: "The 30-day payment window may deserve discussion before signing.",
    priority: "high",
    evidence: EVIDENCE,
    uncertainty: null,
    ...overrides,
  };
}

describe("Review Guide schemas", () => {
  it("accepts all six kinds with grounded evidence", () => {
    const kinds = [
      "topic",
      "party-question",
      "lawyer-question",
      "clarification",
      "confirm",
      "checklist",
    ] as const;
    expect(() =>
      reviewGuideResponseSchema.parse({
        items: kinds.map((kind) =>
          item({
            kind,
            evidence: kind === "confirm" ? null : EVIDENCE,
            uncertainty: kind === "confirm" ? "Not stated in the document." : null,
          }),
        ),
      }),
    ).not.toThrow();
  });

  it("requires evidence for every kind except confirm", () => {
    for (const kind of [
      "topic",
      "party-question",
      "lawyer-question",
      "clarification",
      "checklist",
    ] as const) {
      expect(() =>
        reviewGuideResponseSchema.parse({ items: [item({ kind, evidence: null })] }),
      ).toThrow(new RegExp(`${kind} items require evidence`));
    }
  });

  it("rejects empty guides, bad priorities, and unexpected fields", () => {
    expect(() => reviewGuideResponseSchema.parse({ items: [] })).toThrow();
    expect(() =>
      reviewGuideResponseSchema.parse({ items: [item({ priority: "urgent" })] }),
    ).toThrow();
    expect(() => reviewGuideResponseSchema.parse({ items: [item()], hacked: true })).toThrow();
  });

  it("keeps the transport schema aligned with required keys", () => {
    expect(REVIEW_GUIDE_RESPONSE_SCHEMA.required).toEqual(["items"]);
  });
});
