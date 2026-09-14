/**
 * Q&A pipeline integration: mocked Gemini SDK → real retrieval, prompts,
 * validation, per-document evidence filtering, classification coercion,
 * and caching. No network.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { answerQuestion } from "@/lib/ai/qa";
import { cacheClear } from "@/lib/ai/cache";
import { AIUnavailableError, AIValidationError } from "@/lib/ai/errors";
import { FIXTURE_V1_ID } from "@/lib/documents/fixture-v1";
import { FIXTURE_ID } from "@/lib/documents/fixture";

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

function factPayload() {
  return {
    classification: "document-fact",
    answer: "Invoices are due net 15 days from receipt.",
    evidence: [
      {
        sectionId: "sec-payment",
        sectionTitle: "3. Payment Terms",
        quote: PAYMENT_V1,
        pageNumber: 2,
      },
    ],
    uncertainty: "",
    followUps: ["Is there a late-payment fee?"],
    counselQuestions: [],
    confidence: "high",
  };
}

function v1Doc() {
  return {
    documentId: "v1-doc",
    title: "Agreement v1",
    fixtureId: FIXTURE_V1_ID,
    version: 1,
  };
}

function ok(text: string) {
  return { text };
}

describe("Q&A pipeline integration", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    cacheClear();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("answers with validated evidence attributed to the source document", async () => {
    mockGenerate.mockResolvedValue(ok(JSON.stringify(factPayload())));
    const result = await answerQuestion({
      documents: [v1Doc()],
      question: "What are my payment terms?",
    });
    expect(result.answer.classification).toBe("document-fact");
    expect(result.answer.evidence).toHaveLength(1);
    expect(result.answer.evidence[0]?.quote).toContain("fifteen (15)");
    expect(result.dropped).toBe(0);
    expect(result.model).toBe("gemini-2.5-flash");
  });

  it("coerces evidence-free substantive answers to insufficient-information", async () => {
    mockGenerate.mockResolvedValue(
      ok(
        JSON.stringify({
          ...factPayload(),
          evidence: [
            {
              sectionId: "sec-nope",
              sectionTitle: "Nowhere",
              quote: "This quote is long enough to pass length checks but matches nothing.",
              pageNumber: 9,
            },
          ],
        }),
      ),
    );
    const result = await answerQuestion({
      documents: [v1Doc()],
      question: "What does the agreement say about dragons?",
    });
    expect(result.answer.classification).toBe("missing-information");
    expect(result.answer.evidence).toEqual([]);
    expect(result.answer.answer).toMatch(/couldn't find enough information/i);
    expect(result.dropped).toBe(1);
  });

  it("passes out-of-scope answers through without evidence", async () => {
    mockGenerate.mockResolvedValue(
      ok(
        JSON.stringify({
          classification: "out-of-scope-legal-advice",
          answer:
            "PlainTerms explains what the document says but cannot provide individualized legal advice.",
          evidence: [],
          uncertainty: "Whether this violates any law is outside this product.",
          followUps: [],
          counselQuestions: ["Is this non-compete enforceable in my state?"],
          confidence: "high",
        }),
      ),
    );
    const result = await answerQuestion({
      documents: [v1Doc()],
      question: "Does this contract violate California law?",
    });
    expect(result.answer.classification).toBe("out-of-scope-legal-advice");
    expect(result.answer.counselQuestions).toHaveLength(1);
  });

  it("attributes multi-version evidence to the document that contains it", async () => {
    mockGenerate.mockResolvedValue(
      ok(
        JSON.stringify({
          classification: "document-fact",
          answer: "V1 says net 15 while V2 says net 30 for the same invoice.",
          evidence: [
            {
              sectionId: "sec-payment",
              sectionTitle: "3. Payment Terms",
              quote: PAYMENT_V2,
              pageNumber: 2,
            },
          ],
          uncertainty: "",
          followUps: [],
          counselQuestions: [],
          confidence: "high",
        }),
      ),
    );
    const { PlainTermsQAService } = await import("@/lib/ai/qa-service");
    const service = new PlainTermsQAService();
    const { response } = await service.ask({
      documents: [
        v1Doc(),
        {
          documentId: "v2-doc",
          title: "Agreement v2",
          fixtureId: FIXTURE_ID,
          version: 1,
        },
      ],
      question: "What changed about payment?",
    });
    expect(response.citations).toHaveLength(1);
    expect(response.citations[0]?.documentId).toBe("v2-doc");
  });

  it("caches normalized question variants together", async () => {
    mockGenerate.mockResolvedValue(ok(JSON.stringify(factPayload())));
    const base = { documents: [v1Doc()] };
    await answerQuestion({ ...base, question: "What are my payment terms?" });
    const second = await answerQuestion({ ...base, question: "  what are my PAYMENT terms " });
    expect(second.cached).toBe(true);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("rejects persistently invalid output and reports unavailable without a key", async () => {
    mockGenerate.mockResolvedValue(ok("{still-not-json"));
    await expect(
      answerQuestion({ documents: [v1Doc()], question: "What are my payment terms?" }),
    ).rejects.toBeInstanceOf(AIValidationError);

    process.env.GEMINI_API_KEY = "";
    await expect(
      answerQuestion({ documents: [v1Doc()], question: "What are my payment terms?" }),
    ).rejects.toBeInstanceOf(AIUnavailableError);
  });
});
