/**
 * Action Pack pipeline integration: mocked Gemini SDK → real analysis
 * reuse, prompt, validation, evidence filtering, caching. No network.
 * The mocked analysis bundle is intentionally small; the pack prompt
 * receives it plus section texts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildActionPack } from "@/lib/ai/action-pack";
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
  "Invoices are payable net thirty (30) days from receipt. This Agreement does not provide for a late-payment fee or interest on overdue amounts.";
const TERM_QUOTE =
  "This Agreement begins on the effective date and continues for three months, ending on December 31, 2026, unless terminated earlier under Section 5.";
const TERMINATION_QUOTE =
  "Either party may terminate this Agreement for convenience with thirty (30) days written notice to the other party.";

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

function clausesPayload() {
  return { clauses: [] };
}

function packItem(
  kind: string,
  title: string,
  quote: string | null,
  sectionId: string,
  extra: Record<string, unknown> = {},
) {
  return {
    kind,
    title,
    summary: `${title} — grounded summary sentence for the freelancer reader.`,
    priority: "high",
    evidence:
      quote === null
        ? null
        : {
            sectionId,
            sectionTitle: "Section",
            quote,
            pageNumber: 2,
          },
    uncertainty: null,
    nextStep: "Consider reviewing this before signing the agreement.",
    ...extra,
  };
}

function packPayload() {
  return {
    items: [
      packItem("obligation", "Pay monthly invoices", PAYMENT_QUOTE, "sec-payment"),
      packItem("date", "Agreement end", TERM_QUOTE, "sec-term"),
      packItem("review", "Late-payment gap", PAYMENT_QUOTE, "sec-payment"),
      packItem("clarify", "Confirm payment timing", PAYMENT_QUOTE, "sec-payment"),
      packItem("lawyer", "Review termination scope", TERMINATION_QUOTE, "sec-termination"),
      packItem("checklist", "Confirm party details", null, "sec-parties"),
      packItem("info-needed", "Governing jurisdiction", null, "sec-parties", {
        summary: "The agreement does not identify a governing jurisdiction.",
        uncertainty: "Not stated in the document.",
        nextStep: "Ask which jurisdiction applies to this agreement.",
      }),
      {
        kind: "review",
        title: "Fabricated risk",
        summary: "This cites a section that does not exist anywhere at all.",
        priority: "high",
        evidence: {
          sectionId: "sec-nope",
          sectionTitle: "Nowhere",
          quote: "This quote is long enough to pass length checks but matches nothing at all.",
          pageNumber: 9,
        },
        uncertainty: null,
        nextStep: "Drop this finding quietly and continue onward.",
      },
    ],
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

describe("Action Pack pipeline integration", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    cacheClear();
    process.env.GEMINI_API_KEY = "test-key";
  });

  function routeByContent() {
    mockGenerate.mockImplementation(async (params: { contents?: string }) => {
      const contents = params.contents ?? "";
      if (contents.includes("Prepare an Action Pack")) {
        return ok(JSON.stringify(packPayload()));
      }
      if (contents.includes("- clauses:")) {
        return ok(JSON.stringify(clausesPayload()));
      }
      return ok(JSON.stringify(analysisPayload()));
    });
  }

  it("builds all seven kinds from validated analysis and drops bad evidence", async () => {
    routeByContent();
    const bundle = await buildActionPack(descriptor());
    const kinds = bundle.items.map((item) => item.kind).sort();
    expect(kinds).toEqual(
      ["checklist", "clarify", "date", "info-needed", "lawyer", "obligation", "review"].sort(),
    );
    expect(bundle.items.some((item) => item.title === "Fabricated risk")).toBe(false);
    expect(bundle.dropped).toBe(1);
    expect(bundle.model).toBe("gemini-2.5-flash");
  });

  it("reuses cached analysis and caches the pack", async () => {
    routeByContent();
    await buildActionPack(descriptor());
    const callsAfterFirst = mockGenerate.mock.calls.length;
    const second = await buildActionPack(descriptor());
    expect(second.cached).toBe(true);
    expect(mockGenerate.mock.calls.length).toBe(callsAfterFirst);
  });

  it("rejects persistently invalid output and reports unavailable without a key", async () => {
    mockGenerate.mockResolvedValue(ok("{still-not-json"));
    await expect(buildActionPack(descriptor())).rejects.toBeInstanceOf(AIValidationError);

    mockGenerate.mockReset();
    process.env.GEMINI_API_KEY = "";
    await expect(buildActionPack(descriptor())).rejects.toBeInstanceOf(AIUnavailableError);
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
