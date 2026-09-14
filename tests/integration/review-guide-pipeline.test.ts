/**
 * Review Guide pipeline integration: mocked Gemini SDK → real analysis
 * reuse, comparison reuse, prompt, validation, per-document evidence
 * filtering, caching. No network.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildReviewGuide } from "@/lib/ai/review-guide";
import { cacheClear } from "@/lib/ai/cache";
import { AIUnavailableError, AIValidationError } from "@/lib/ai/errors";
import { FIXTURE_ID } from "@/lib/documents/fixture";
import { FIXTURE_V1_ID } from "@/lib/documents/fixture-v1";

const { mockGenerate } = vi.hoisted(() => ({ mockGenerate: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerate };
  },
}));

const PAYMENT_QUOTE =
  "Invoices are payable net thirty (30) days from receipt. This Agreement does not provide for a late-payment fee or interest on overdue amounts.";
const IP_QUOTE =
  "The Contractor assigns to the Client all right, title, and interest in the final deliverables on receipt of final payment in full.";

function analysisPayload() {
  return {
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
      areasToReview: ["Payment timing", "IP transfer"],
    },
    obligations: [],
    dates: [],
    concerns: [],
  };
}

function guidePayload() {
  const evidence = (documentId: string) => ({
    documentId,
    sectionId: "sec-payment",
    sectionTitle: "3. Payment Terms",
    quote: PAYMENT_QUOTE,
    pageNumber: 2,
  });
  return {
    items: [
      {
        kind: "topic",
        title: "Payment timing",
        summary: "The 30-day window may deserve discussion before signing.",
        priority: "high",
        evidence: evidence("doc-1"),
        uncertainty: null,
      },
      {
        kind: "party-question",
        title: "Confirm payment timing",
        summary: "Can you confirm whether the 30-day payment term is intentional?",
        priority: "high",
        evidence: evidence("doc-1"),
        uncertainty: null,
      },
      {
        kind: "lawyer-question",
        title: "Review the restriction",
        summary: "How should the 12-month restriction be understood in context?",
        priority: "high",
        evidence: {
          documentId: "doc-1",
          sectionId: "sec-restrictions",
          sectionTitle: "8. Restrictive Covenants",
          quote:
            "For twelve (12) months following termination, the Contractor will not provide brand design services to direct competitors",
          pageNumber: 4,
        },
        uncertainty: "Geographic scope is not stated.",
      },
      {
        kind: "clarification",
        title: "Clarify IP transfer",
        summary: "Could you clarify when ownership of deliverables transfers?",
        priority: "medium",
        evidence: {
          documentId: "doc-1",
          sectionId: "sec-ip",
          sectionTitle: "7. Intellectual Property",
          quote: IP_QUOTE,
          pageNumber: 4,
        },
        uncertainty: null,
      },
      {
        kind: "checklist",
        title: "Confirm payment timing",
        summary: "Confirm the 30-day payment timing before signing.",
        priority: "high",
        evidence: evidence("doc-1"),
        uncertainty: null,
      },
      {
        kind: "confirm",
        title: "Governing jurisdiction",
        summary: "The agreement does not identify a governing jurisdiction.",
        priority: "medium",
        evidence: null,
        uncertainty: "Not stated in the document.",
      },
      {
        kind: "topic",
        title: "Fabricated topic",
        summary: "This cites a section that does not exist anywhere at all.",
        priority: "high",
        evidence: {
          documentId: "doc-1",
          sectionId: "sec-nope",
          sectionTitle: "Nowhere",
          quote: "This quote is long enough to pass length checks but matches nothing at all.",
          pageNumber: 9,
        },
        uncertainty: null,
      },
    ],
  };
}

function comparisonPayload() {
  return {
    summary: "PlainTerms identified 1 potentially important change.",
    changes: [
      {
        category: "payment",
        kind: "changed",
        materiality: "material",
        favors: "client",
        title: "Payment terms",
        whatChanged: "Net 15 became net 30.",
        whyItMatters: "Cash flow arrives later.",
        implication: "Later payment.",
        questionToConsider: "Was it intentional?",
        nextStep: "Ask about it.",
        confidence: "high",
        leftEvidence: {
          version: "v1",
          sectionId: "sec-payment",
          sectionTitle: "3. Payment Terms",
          quote:
            "Invoices are payable net fifteen (15) days from receipt. Late payments bear interest.",
          pageNumber: 2,
        },
        rightEvidence: {
          version: "v2",
          sectionId: "sec-payment",
          sectionTitle: "3. Payment Terms",
          quote: PAYMENT_QUOTE,
          pageNumber: 2,
        },
      },
    ],
    silence: [],
    verdict: "Version 2 shifts payment timing risk.",
    verdictDrivers: ["Net 15 to net 30"],
  };
}

function ok(text: string) {
  return { text };
}

function descriptor() {
  return {
    documentId: "doc-1",
    title: "Agreement",
    fixtureId: FIXTURE_ID,
    version: 1,
  };
}

describe("Review Guide pipeline integration", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    cacheClear();
    process.env.GEMINI_API_KEY = "test-key";
  });

  function routeByContent() {
    mockGenerate.mockImplementation(async (params: { contents?: string }) => {
      const contents = params.contents ?? "";
      if (contents.includes("Prepare a Review Guide")) {
        return ok(JSON.stringify(guidePayload()));
      }
      if (contents.includes("- clauses:")) {
        return ok(JSON.stringify({ clauses: [] }));
      }
      if (contents.includes("Comparing (")) {
        return ok(JSON.stringify(comparisonPayload()));
      }
      return ok(JSON.stringify(analysisPayload()));
    });
  }

  it("builds all six areas from validated analysis and drops bad evidence", async () => {
    routeByContent();
    const bundle = await buildReviewGuide(descriptor());
    const kinds = bundle.items.map((item) => item.kind).sort();
    expect(kinds).toEqual(
      [
        "checklist",
        "clarification",
        "confirm",
        "lawyer-question",
        "party-question",
        "topic",
      ].sort(),
    );
    expect(bundle.items.some((item) => item.title === "Fabricated topic")).toBe(false);
    expect(bundle.dropped).toBe(1);
    expect(bundle.compareDocumentId).toBeNull();
  });

  it("reuses the comparison engine when a second document is provided", async () => {
    routeByContent();
    const bundle = await buildReviewGuide({
      ...descriptor(),
      compareWith: {
        documentId: "v1-doc",
        title: "Agreement v1",
        fixtureId: FIXTURE_V1_ID,
        version: 1,
      },
    });
    expect(bundle.compareDocumentId).toBe("v1-doc");
    expect(bundle.items.length).toBeGreaterThan(0);
  });

  it("reuses cached guides and reports unavailable without a key", async () => {
    routeByContent();
    await buildReviewGuide(descriptor());
    const callsAfterFirst = mockGenerate.mock.calls.length;
    const second = await buildReviewGuide(descriptor());
    expect(second.cached).toBe(true);
    expect(mockGenerate.mock.calls.length).toBe(callsAfterFirst);

    // Fresh descriptor so the cache cannot mask the missing key.
    mockGenerate.mockClear();
    process.env.GEMINI_API_KEY = "";
    await expect(
      buildReviewGuide({ ...descriptor(), documentId: "doc-unkeyed" }),
    ).rejects.toBeInstanceOf(AIUnavailableError);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("rejects persistently invalid output", async () => {
    mockGenerate.mockResolvedValue(ok("{still-not-json"));
    await expect(buildReviewGuide(descriptor())).rejects.toBeInstanceOf(AIValidationError);
  });
});
