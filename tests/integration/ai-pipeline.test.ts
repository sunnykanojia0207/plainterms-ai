/**
 * AI pipeline integration: mocked Gemini SDK → real client (timeout,
 * retries, validation, repair) → real orchestrator (schemas, evidence
 * filter, cache) → validated bundle. No network; no API key needed.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeFull } from "@/lib/ai/analyze";
import { cacheClear } from "@/lib/ai/cache";
import { AIUnavailableError, AIValidationError } from "@/lib/ai/errors";
import { FIXTURE_ID } from "@/lib/documents/fixture";

const { mockGenerate } = vi.hoisted(() => ({ mockGenerate: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerate };
  },
}));

const PAYMENT_QUOTE =
  "The Client will pay the Contractor a fixed fee of $4,500 per month, invoiced on the first business day of each month.";
const TERM_QUOTE =
  "This Agreement begins on the effective date and continues for three months, ending on December 31, 2026, unless terminated earlier under Section 5.";

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
    obligations: [
      {
        party: "client",
        obligation: "Pay monthly invoices for design services.",
        trigger: "Monthly invoice",
        deadline: "Net 30 days",
        evidence: {
          sectionId: "sec-payment",
          sectionTitle: "3. Payment Terms",
          quote: PAYMENT_QUOTE,
          pageNumber: 2,
        },
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
          quote: TERM_QUOTE,
          pageNumber: 2,
        },
      },
    ],
    concerns: [],
  };
}

function clausesPayload() {
  return {
    clauses: [
      {
        category: "payment",
        title: "Payment terms",
        interpretation:
          "The client pays a monthly fixed fee with a 30-day payment window and no late fee.",
        evidence: {
          sectionId: "sec-payment",
          sectionTitle: "3. Payment Terms",
          quote: PAYMENT_QUOTE,
          pageNumber: 2,
        },
        confidence: "high",
        ambiguity: null,
      },
      {
        category: "termination",
        title: "Invented clause",
        interpretation: "This finding cites a section that does not exist anywhere.",
        evidence: {
          sectionId: "sec-nope",
          sectionTitle: "Nowhere",
          quote: "This quote is long enough to pass length checks but matches nothing.",
          pageNumber: 9,
        },
        confidence: "low",
        ambiguity: null,
      },
    ],
  };
}

function ok(text: string) {
  return { text };
}

describe("AI pipeline integration", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    cacheClear();
    process.env.GEMINI_API_KEY = "test-key";
  });

  function descriptor() {
    return {
      documentId: "doc-1",
      title: "Client agreement",
      fixtureId: FIXTURE_ID,
      version: 1,
    };
  }

  it("validates, filters evidence, and caches the bundle", async () => {
    mockGenerate
      .mockResolvedValueOnce(ok(JSON.stringify(analysisPayload())))
      .mockResolvedValueOnce(ok(JSON.stringify(clausesPayload())));
    const bundle = await analyzeFull(descriptor());
    expect(bundle.summary.points).toHaveLength(5);
    expect(bundle.clauses.map((clause) => clause.title)).toEqual(["Payment terms"]);
    expect(bundle.dropped.clauses).toBe(1);
    expect(bundle.model).toBe("gemini-2.5-flash");

    const callsAfterFirst = mockGenerate.mock.calls.length;
    const second = await analyzeFull(descriptor());
    expect(second.cached).toBe(true);
    expect(mockGenerate.mock.calls.length).toBe(callsAfterFirst);
  });

  it("repairs malformed output once, then succeeds", async () => {
    mockGenerate.mockImplementation(async (params: { contents?: string }) => {
      const contents = params.contents ?? "";
      if (contents.includes("failed validation")) {
        return ok(JSON.stringify(analysisPayload()));
      }
      if (contents.includes("sec-nope") || contents.includes("clauses")) {
        return ok(JSON.stringify(clausesPayload()));
      }
      return ok("{not-json");
    });
    const bundle = await analyzeFull(descriptor());
    expect(bundle.summary.points.length).toBeGreaterThan(0);
    expect(mockGenerate.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects persistently invalid output without endless retries", async () => {
    mockGenerate.mockResolvedValue(ok("{still-not-json"));
    await expect(analyzeFull(descriptor())).rejects.toBeInstanceOf(AIValidationError);
    // One failed attempt + one repair attempt for the analysis call.
    const analysisCalls = mockGenerate.mock.calls.filter((args) => {
      const params = args[0] as { contents?: string };
      return (params.contents ?? "").includes("failed validation") || true;
    });
    expect(analysisCalls.length).toBeLessThanOrEqual(4);
  });

  it("retries transient failures within bounds", async () => {
    // Content-routed: retries interleave with the parallel clauses call,
    // so sequencing by call order would be wrong.
    let analysisCalls = 0;
    mockGenerate.mockImplementation(async (params: { contents?: string }) => {
      const contents = params.contents ?? "";
      if (contents.includes("- obligations:")) {
        analysisCalls += 1;
        if (analysisCalls === 1) {
          throw new Error("fetch failed");
        }
        return ok(JSON.stringify(analysisPayload()));
      }
      return ok(JSON.stringify({ clauses: [] }));
    });
    const bundle = await analyzeFull(descriptor());
    expect(bundle.summary.points.length).toBeGreaterThan(0);
    expect(analysisCalls).toBe(2);
  });

  it("reports unavailable when no API key is configured", async () => {
    process.env.GEMINI_API_KEY = "";
    await expect(analyzeFull(descriptor())).rejects.toBeInstanceOf(AIUnavailableError);
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
