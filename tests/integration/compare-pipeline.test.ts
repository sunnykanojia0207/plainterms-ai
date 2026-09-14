/**
 * Comparison pipeline integration: mocked Gemini SDK → real orchestrator
 * (alignment, validation, per-version evidence filter, cache). No network.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { compareDocuments } from "@/lib/ai/compare";
import { comparisonCacheKey, cacheClear } from "@/lib/ai/cache";
import { AIUnavailableError, AIValidationError } from "@/lib/ai/errors";
import { FIXTURE_ID } from "@/lib/documents/fixture";
import { FIXTURE_V1_ID } from "@/lib/documents/fixture-v1";

const { mockGenerate } = vi.hoisted(() => ({ mockGenerate: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerate };
  },
}));

const PAYMENT_V1 =
  "Invoices are payable net fifteen (15) days from receipt. Late payments bear interest of 1.5% per month.";
const PAYMENT_V2 =
  "Invoices are payable net thirty (30) days from receipt. This Agreement does not provide for a late-payment fee or interest on overdue amounts.";
const NONCOMPETE_V1 =
  "For six (6) months following termination, the Contractor will not provide brand design services to direct competitors of the Client identified in Exhibit B.";
const NONCOMPETE_V2 =
  "For twelve (12) months following termination, the Contractor will not provide brand design services to direct competitors of the Client identified in Exhibit B.";
const LATE_FEE = "Late payments bear interest of 1.5% per month.";
const EXTENSION =
  "The parties may extend the term by written agreement signed by both parties before the end date.";

function comparisonPayload() {
  return {
    summary: "PlainTerms identified 3 potentially important changes between the two versions.",
    changes: [
      {
        category: "payment",
        kind: "changed",
        materiality: "material",
        favors: "client",
        title: "Payment terms",
        whatChanged: "The payment window moved from net 15 to net 30.",
        whyItMatters: "The freelancer waits longer to be paid.",
        implication: "Cash flow arrives up to 15 days later with no late fee.",
        questionToConsider: "Was the longer window intentional?",
        nextStep: "Consider asking for net-15 or a late fee.",
        confidence: "high",
        leftEvidence: {
          version: "v1",
          sectionId: "sec-payment",
          sectionTitle: "3. Payment Terms",
          quote: PAYMENT_V1,
          pageNumber: 2,
        },
        rightEvidence: {
          version: "v2",
          sectionId: "sec-payment",
          sectionTitle: "3. Payment Terms",
          quote: PAYMENT_V2,
          pageNumber: 2,
        },
      },
      {
        category: "restrictions",
        kind: "changed",
        materiality: "material",
        favors: "client",
        title: "Non-compete length",
        whatChanged: "The restriction grew from 6 months to 12 months.",
        whyItMatters: "Future client work is blocked for twice as long.",
        implication: "A full year without competing engagements.",
        questionToConsider: "Is a 12-month restriction acceptable?",
        nextStep: "Consider asking to restore 6 months.",
        confidence: "very-high",
        leftEvidence: {
          version: "v1",
          sectionId: "sec-restrictions",
          sectionTitle: "8. Restrictive Covenants",
          quote: NONCOMPETE_V1,
          pageNumber: 4,
        },
        rightEvidence: {
          version: "v2",
          sectionId: "sec-restrictions",
          sectionTitle: "8. Restrictive Covenants",
          quote: NONCOMPETE_V2,
          pageNumber: 4,
        },
      },
      {
        category: "term",
        kind: "added",
        materiality: "cosmetic",
        favors: "neutral",
        title: "Extension option",
        whatChanged: "V2 adds an extension-by-agreement sentence.",
        whyItMatters: "Renewals now have an explicit path.",
        implication: "Extending is easier to arrange.",
        questionToConsider: "Do you want an explicit extension path?",
        nextStep: "No action needed unless you oppose extensions.",
        confidence: "high",
        leftEvidence: null,
        rightEvidence: {
          version: "v2",
          sectionId: "sec-term",
          sectionTitle: "4. Term",
          quote: EXTENSION,
          pageNumber: 2,
        },
      },
      {
        category: "payment",
        kind: "removed",
        materiality: "material",
        favors: "client",
        title: "Fabricated change",
        whatChanged: "This cites a section that does not exist.",
        whyItMatters: "It should never be displayed anywhere.",
        implication: "Nothing, it gets dropped.",
        questionToConsider: "Why was this generated?",
        nextStep: "Drop this finding quietly and continue.",
        confidence: "low",
        leftEvidence: {
          version: "v1",
          sectionId: "sec-nope",
          sectionTitle: "Nowhere",
          quote: "This quote is long enough to pass length checks but matches nothing at all.",
          pageNumber: 9,
        },
        rightEvidence: null,
      },
    ],
    silence: [
      {
        state: "removed",
        subject: "Late-payment interest",
        leftEvidence: {
          version: "v1",
          sectionId: "sec-payment",
          sectionTitle: "3. Payment Terms",
          quote: LATE_FEE,
          pageNumber: 2,
        },
        rightEvidence: null,
        whatWeKnow: "V1 charged 1.5% monthly interest on late payment.",
        whatRemainsUncertain: null,
        questionToConsider: "Was the interest removed intentionally?",
        confidence: "high",
      },
    ],
    verdict: "Version 2 shifts payment timing and future-work risk to the freelancer.",
    verdictDrivers: ["Net 15 to net 30", "Non-compete 6 to 12 months"],
  };
}

function descriptors() {
  return {
    left: {
      documentId: "v1-doc",
      title: "Agreement v1",
      fixtureId: FIXTURE_V1_ID,
      version: 1,
    },
    right: {
      documentId: "v2-doc",
      title: "Agreement v2",
      fixtureId: FIXTURE_ID,
      version: 1,
    },
  };
}

function ok(text: string) {
  return { text };
}

describe("comparison pipeline integration", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    cacheClear();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("validates, filters evidence per version, and caches", async () => {
    mockGenerate.mockResolvedValue(ok(JSON.stringify(comparisonPayload())));
    const { left, right } = descriptors();
    const bundle = await compareDocuments(left, right);

    expect(bundle.changes.map((change) => change.title)).toEqual([
      "Payment terms",
      "Non-compete length",
      "Extension option",
    ]);
    expect(bundle.dropped.changes).toBe(1);
    expect(bundle.silence.map((finding) => finding.subject)).toEqual(["Late-payment interest"]);
    expect(bundle.silence[0]?.state).toBe("removed");
    // Confidentiality is identical: counted, never reported.
    expect(bundle.unchanged).toContain("6. Confidentiality");
    expect(bundle.verdict).toContain("Version 2");

    const callsAfterFirst = mockGenerate.mock.calls.length;
    const second = await compareDocuments(left, right);
    expect(second.cached).toBe(true);
    expect(mockGenerate.mock.calls.length).toBe(callsAfterFirst);
  });

  it("returns a deterministic result without model calls when identical", async () => {
    const { left } = descriptors();
    const same = { ...left, documentId: "v1-copy" };
    const bundle = await compareDocuments(left, same);
    expect(bundle.changes).toEqual([]);
    expect(bundle.silence).toEqual([]);
    expect(bundle.summary).toMatch(/identical/i);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("rejects persistently invalid output without endless retries", async () => {
    mockGenerate.mockResolvedValue(ok("{still-not-json"));
    const { left, right } = descriptors();
    await expect(compareDocuments(left, right)).rejects.toBeInstanceOf(AIValidationError);
    // One attempt + one repair attempt.
    expect(mockGenerate.mock.calls.length).toBe(2);
  });

  it("reports unavailable when no API key is configured", async () => {
    process.env.GEMINI_API_KEY = "";
    const { left, right } = descriptors();
    await expect(compareDocuments(left, right)).rejects.toBeInstanceOf(AIUnavailableError);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("keys the cache on both documents and versions", () => {
    const key = comparisonCacheKey({
      leftDocumentId: "a",
      leftVersion: 1,
      rightDocumentId: "b",
      rightVersion: 2,
    });
    expect(key).toContain("a");
    expect(key).toContain("b");
    expect(key).toContain("comparison-v1");
  });
});
