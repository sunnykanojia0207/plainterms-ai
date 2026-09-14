import { describe, expect, it } from "vitest";
import { QA_RESPONSE_SCHEMA, documentAnswerSchema } from "@/lib/ai/qa-schemas";

const EVIDENCE = {
  sectionId: "sec-payment",
  sectionTitle: "3. Payment Terms",
  quote:
    "Invoices are payable net fifteen (15) days from receipt. Late payments bear interest of 1.5% per month.",
  pageNumber: 2,
};

function factAnswer(overrides: Record<string, unknown> = {}) {
  return {
    classification: "document-fact",
    answer: "Invoices are due net 15 days from receipt.",
    evidence: [EVIDENCE],
    uncertainty: "",
    followUps: ["Is there a late-payment fee?"],
    counselQuestions: [],
    confidence: "high",
    ...overrides,
  };
}

describe("Q&A schemas", () => {
  it("accepts a well-formed fact answer", () => {
    expect(() => documentAnswerSchema.parse(factAnswer())).not.toThrow();
  });

  it("rejects substantive answers without evidence", () => {
    expect(() => documentAnswerSchema.parse(factAnswer({ evidence: [] }))).toThrow(
      /at least one evidence/i,
    );
    expect(() =>
      documentAnswerSchema.parse(
        factAnswer({
          classification: "document-interpretation",
          evidence: [],
        }),
      ),
    ).toThrow();
  });

  it("accepts safe shapes with empty evidence", () => {
    for (const classification of [
      "missing-information",
      "out-of-scope-legal-advice",
      "unrelated",
    ]) {
      expect(() =>
        documentAnswerSchema.parse(factAnswer({ classification, evidence: [] })),
      ).not.toThrow();
    }
  });

  it("rejects evidence on non-substantive answers and unexpected fields", () => {
    expect(() => documentAnswerSchema.parse(factAnswer({ classification: "unrelated" }))).toThrow(
      /must not carry evidence/i,
    );
    expect(() => documentAnswerSchema.parse({ ...factAnswer(), hacked: true })).toThrow();
  });

  it("keeps the transport schema aligned with required keys", () => {
    expect(QA_RESPONSE_SCHEMA.required).toEqual(
      expect.arrayContaining([
        "classification",
        "answer",
        "evidence",
        "uncertainty",
        "followUps",
        "counselQuestions",
        "confidence",
      ]),
    );
  });
});
