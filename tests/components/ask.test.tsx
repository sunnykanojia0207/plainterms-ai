import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AskWorkspace } from "@/components/documents/AskWorkspace";
import type { AIResponse } from "@/lib/domain/types";

function readyResponse(overrides: Partial<AIResponse> = {}): AIResponse {
  return {
    answer: "Invoices are due net 15 days from receipt.",
    classification: "document-fact",
    citations: [
      {
        clauseId: "sample-service-agreement-v1:sec-payment:0",
        documentId: "sample-service-agreement-v1",
        sectionId: "sec-payment",
        location: "3. Payment Terms · p. 2",
        quote: "Invoices are payable net fifteen (15) days from receipt.",
        pageNumber: 2,
      },
    ],
    confidence: "high",
    ambiguities: [],
    gaps: [],
    followUps: ["Is there a late-payment fee?"],
    counselQuestions: [],
    ...overrides,
  };
}

describe("AskWorkspace", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  function mockAsk(payload: unknown, status = 200) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(payload), { status })),
    );
  }

  async function submitQuestion(user: ReturnType<typeof userEvent.setup>, question: string) {
    await user.type(screen.getByLabelText("Ask about this document"), question);
    await user.click(screen.getByRole("button", { name: "Ask" }));
  }

  it("answers with evidence blocks and source jumps", async () => {
    mockAsk(readyResponse());
    const user = userEvent.setup();
    render(<AskWorkspace />);
    expect(screen.getByText("Try asking")).toBeInTheDocument();

    await submitQuestion(user, "What are my payment terms?");
    const heading = await screen.findByRole("heading", { name: "Answer" });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText(/due net 15 days/)).toBeInTheDocument();
    const jump = screen.getByRole("link", { name: /Verify in document/ });
    expect(jump).toHaveAttribute("href", "/review/sample-service-agreement-v1#viewer-sec-payment");
    expect(jump).toHaveAttribute("target", "_blank");

    await user.click(screen.getByRole("button", { name: "Is there a late-payment fee?" }));
    const headings = await screen.findAllByRole("heading", { name: "Answer" });
    expect(headings).toHaveLength(2);
  });

  it("renders insufficient and out-of-scope shapes honestly", async () => {
    mockAsk(
      readyResponse({
        classification: "missing-information",
        answer: "I couldn't find enough information in this document to answer that reliably.",
        citations: [],
        confidence: "low",
      }),
    );
    const user = userEvent.setup();
    render(<AskWorkspace />);
    await submitQuestion(user, "What does the agreement say about dragons?");
    expect(await screen.findByText(/couldn't find enough information/)).toBeInTheDocument();
    expect(screen.getByText("Limited answer")).toBeInTheDocument();
  });

  it("shows professional-review prompts for out-of-scope questions", async () => {
    mockAsk(
      readyResponse({
        classification: "out-of-scope-legal-advice",
        answer: "PlainTerms explains documents but cannot give legal advice.",
        citations: [],
        counselQuestions: ["Is this enforceable in my state?"],
      }),
    );
    const user = userEvent.setup();
    render(<AskWorkspace />);
    await submitQuestion(user, "Is this legal?");
    expect(await screen.findByText("Questions for a legal professional")).toBeInTheDocument();
  });

  it("retries after errors and records recent questions", async () => {
    const fetchMock = vi.fn(async () => new Response("boom", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<AskWorkspace />);
    await submitQuestion(user, "What are my payment terms?");
    expect(await screen.findByText("The answer didn't come back")).toBeInTheDocument();

    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify(readyResponse()), { status: 200 }),
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByRole("heading", { name: "Answer" });

    const recent = screen.getByLabelText("Recent questions");
    // Both the failed attempt and the successful retry are recorded.
    const entries = within(recent).getAllByText("What are my payment terms?");
    expect(entries).toHaveLength(2);
    await user.click(entries[1] as HTMLElement);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("shows the unavailable state without losing the draft scope", async () => {
    mockAsk({ code: "ai-unavailable" }, 503);
    const user = userEvent.setup();
    render(<AskWorkspace />);
    await submitQuestion(user, "What are my payment terms?");
    expect(await screen.findByText("Answers are temporarily unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
