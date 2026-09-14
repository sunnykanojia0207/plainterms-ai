import { describe, expect, it } from "vitest";
import {
  CLAUSE_INTELLIGENCE_RESPONSE_SCHEMA,
  clauseIntelligenceSchema,
  DOCUMENT_ANALYSIS_RESPONSE_SCHEMA,
  documentAnalysisSchema,
} from "@/lib/ai/schemas";

const EVIDENCE = {
  sectionId: "sec-payment",
  sectionTitle: "3. Payment Terms",
  quote:
    "The Client will pay the Contractor a fixed fee of $4,500 per month, invoiced on the first business day of each month.",
  pageNumber: 2,
};

const ANALYSIS_SAMPLE = {
  summary: {
    points: [
      "A three-month brand design engagement between Brightline Studio LLC and Maya Chen.",
      "The contractor delivers a logo suite, palette, typography, and usage guide.",
      "The client pays $4,500 per month, invoiced monthly and due net 30.",
      "Either party may end the agreement with 30 days written notice.",
      "Intellectual property transfers only on receipt of final payment in full.",
    ],
    parties: ["Brightline Studio LLC", "Maya Chen"],
    effectiveDate: "October 1, 2026",
    areasToReview: ["Payment timing", "IP transfer", "Non-compete scope"],
  },
  obligations: [
    {
      party: "client",
      obligation: "Pay monthly invoices for design services.",
      trigger: "Monthly invoice",
      deadline: "Net 30 days",
      evidence: EVIDENCE,
      importance: "high",
    },
  ],
  dates: [
    {
      label: "Agreement end",
      date: "December 31, 2026",
      evidence: {
        sectionId: "sec-term",
        sectionTitle: "4. Term",
        quote:
          "This Agreement begins on the effective date and continues for three months, ending on December 31, 2026, unless terminated earlier under Section 5.",
        pageNumber: 2,
      },
    },
  ],
  concerns: [
    {
      title: "No late-payment fee",
      concern:
        "Invoices are due net 30 with no stated late fee, so delayed payment has no contractual cost to the client.",
      severity: "potential-concern",
      evidence: {
        sectionId: "sec-payment",
        sectionTitle: "3. Payment Terms",
        quote:
          "Invoices are payable net thirty (30) days from receipt. This Agreement does not provide for a late-payment fee or interest on overdue amounts.",
        pageNumber: 2,
      },
      confidence: "high",
    },
  ],
};

const CLAUSES_SAMPLE = {
  clauses: [
    {
      category: "payment",
      title: "Payment terms",
      interpretation:
        "The client pays a monthly fixed fee with a 30-day payment window and no late fee.",
      evidence: EVIDENCE,
      confidence: "high",
      ambiguity: null,
    },
  ],
};

describe("structured schemas", () => {
  it("accepts a well-formed analysis payload", () => {
    expect(() => documentAnalysisSchema.parse(ANALYSIS_SAMPLE)).not.toThrow();
  });

  it("accepts a well-formed clause payload", () => {
    expect(() => clauseIntelligenceSchema.parse(CLAUSES_SAMPLE)).not.toThrow();
  });

  it("rejects missing evidence, bad enums, and unexpected fields", () => {
    expect(() =>
      clauseIntelligenceSchema.parse({
        clauses: [
          {
            category: "payment",
            title: "T",
            interpretation: "This interpretation is long enough to pass.",
            evidence: { sectionId: "sec-payment" },
            confidence: "high",
            ambiguity: null,
          },
        ],
      }),
    ).toThrow();
    expect(() =>
      clauseIntelligenceSchema.parse({
        clauses: [
          {
            category: " vibes",
            title: "T",
            interpretation: "This interpretation is long enough to pass.",
            evidence: EVIDENCE,
            confidence: "high",
            ambiguity: null,
          },
        ],
      }),
    ).toThrow();
    expect(() => documentAnalysisSchema.parse({ ...ANALYSIS_SAMPLE, hacked: true })).toThrow();
  });

  it("keeps transport schemas aligned with required top-level keys", () => {
    expect(DOCUMENT_ANALYSIS_RESPONSE_SCHEMA.required).toEqual(
      expect.arrayContaining(["summary", "obligations", "dates", "concerns"]),
    );
    expect(CLAUSE_INTELLIGENCE_RESPONSE_SCHEMA.required).toEqual(["clauses"]);
  });
});
