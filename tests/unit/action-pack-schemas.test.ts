import { describe, expect, it } from "vitest";
import {
  ACTION_PACK_RESPONSE_SCHEMA,
  actionPackResponseSchema,
} from "@/lib/ai/action-pack-schemas";

const EVIDENCE = {
  sectionId: "sec-payment",
  sectionTitle: "3. Payment Terms",
  quote:
    "Invoices are payable net thirty (30) days from receipt. This Agreement does not provide for a late-payment fee or interest on overdue amounts.",
  pageNumber: 2,
};

function item(overrides: Record<string, unknown> = {}) {
  return {
    kind: "obligation",
    title: "Pay invoices on time",
    summary: "The client must pay monthly invoices within 30 days of receipt.",
    priority: "high",
    evidence: EVIDENCE,
    uncertainty: null,
    nextStep: "Consider calendaring invoice dates.",
    ...overrides,
  };
}

describe("Action Pack schemas", () => {
  it("accepts all seven kinds with grounded evidence", () => {
    const kinds = [
      "obligation",
      "date",
      "review",
      "clarify",
      "lawyer",
      "checklist",
      "info-needed",
    ] as const;
    expect(() =>
      actionPackResponseSchema.parse({
        items: kinds.map((kind) =>
          item({
            kind,
            evidence: kind === "info-needed" ? null : EVIDENCE,
          }),
        ),
      }),
    ).not.toThrow();
  });

  it("requires evidence for grounded kinds", () => {
    for (const kind of ["obligation", "date", "review", "clarify", "lawyer"] as const) {
      expect(() =>
        actionPackResponseSchema.parse({ items: [item({ kind, evidence: null })] }),
      ).toThrow(new RegExp(`${kind} items require evidence`));
    }
  });

  it("allows confirm-framed checklist items without evidence", () => {
    expect(() =>
      actionPackResponseSchema.parse({
        items: [
          item({
            kind: "checklist",
            evidence: null,
            summary: "Confirm the party details — verify before signing.",
          }),
        ],
      }),
    ).not.toThrow();
  });

  it("rejects empty packs, bad priorities, and unexpected fields", () => {
    expect(() => actionPackResponseSchema.parse({ items: [] })).toThrow();
    expect(() =>
      actionPackResponseSchema.parse({ items: [item({ priority: "urgent" })] }),
    ).toThrow();
    expect(() => actionPackResponseSchema.parse({ items: [item()], hacked: true })).toThrow();
  });

  it("keeps the transport schema aligned with required keys", () => {
    expect(ACTION_PACK_RESPONSE_SCHEMA.required).toEqual(["items"]);
  });
});
