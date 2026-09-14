import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentOutline } from "@/components/documents/DocumentOutline";
import { ReadyView } from "@/components/documents/ReadyView";
import { ReviewWorkspace } from "@/components/documents/ReviewWorkspace";
import { ToastProvider } from "@/components/ui/Toast";
import { getFixtureSections } from "@/lib/documents/fixture";
import { addUpload, resetStoreForTests, setDocumentStatus } from "@/lib/documents/store";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  };
});

const SECTIONS = getFixtureSections("doc-1");

describe("DocumentOutline", () => {
  it("lists sections and marks the current one", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<DocumentOutline sections={SECTIONS} activeId="sec-payment" onSelect={onSelect} />);
    const current = screen.getByRole("button", { name: /Payment Terms/ });
    expect(current).toHaveAttribute("aria-current", "location");
    await user.click(screen.getByRole("button", { name: /Termination/ }));
    expect(onSelect).toHaveBeenCalledWith("sec-termination");
  });
});

describe("ReadyView", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetStoreForTests([]);
  });

  it("shows an overview with labeled preview and onward actions", () => {
    const document = addUpload({ fileName: "client.pdf", title: "Client agreement" });
    setDocumentStatus(document.id, "ready");
    render(<ReadyView documentId={document.id} />);
    expect(screen.getByRole("heading", { name: "Client agreement" })).toBeInTheDocument();
    // Uploaded (non-sample) documents get the upload preview label.
    expect(screen.getByText(/Preview of your uploaded document/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review document" })).toHaveAttribute(
      "href",
      `/review/${document.id}`,
    );
  });

  it("explains unknown documents instead of crashing", () => {
    render(<ReadyView documentId="missing" />);
    expect(screen.getByRole("alert")).toHaveTextContent("doesn't exist");
  });
});

describe("ReviewWorkspace", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetStoreForTests([]);
    vi.unstubAllGlobals();
  });

  function renderWorkspace(id: string) {
    return render(
      <ToastProvider>
        <ReviewWorkspace documentId={id} />
      </ToastProvider>,
    );
  }

  function mockAnalysisApi(payload: unknown, status = 200) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(payload), { status })),
    );
  }

  const ANALYSIS_PAYLOAD = {
    summary: "A three-month design engagement with monthly payments.",
    keyFacts: ["$4,500 per month", "Net-30 payment"],
    findings: [
      {
        id: "doc-1:finding-0",
        clauseId: "doc-1:sec-payment",
        headline: "No late-payment fee",
        whyItMatters: "Delayed payment has no contractual cost to the client.",
        severity: "potential-concern",
        confidence: "high",
        evidence: {
          clauseId: "doc-1:sec-payment",
          documentId: "doc-1",
          sectionId: "sec-payment",
          location: "3. Payment Terms · p. 2",
          quote: "Invoices are payable net thirty (30) days from receipt.",
          pageNumber: 2,
        },
      },
    ],
    clauses: [
      {
        id: "doc-1:sec-payment:payment",
        documentId: "doc-1",
        sectionRef: "3. Payment Terms",
        evidenceSectionId: "sec-payment",
        pageNumber: 2,
        title: "Payment terms",
        plainExplanation: "The client pays monthly with a 30-day window.",
        originalText: "The Client will pay the Contractor a fixed fee of $4,500 per month.",
        importance: 5,
        severity: "potential-concern",
        flags: [],
        obligation: null,
        affectedParty: "both",
        questionsToConsider: [],
        confidence: "high",
        ambiguities: [],
      },
    ],
    obligations: [
      {
        id: "doc-1:obligation-0",
        description: "Pay monthly invoices.",
        owner: "client",
        dueHint: "Net 30 days",
        clauseId: "doc-1:sec-payment",
        evidenceSectionId: "sec-payment",
      },
    ],
    dates: [
      {
        id: "doc-1:date-0",
        label: "Agreement end",
        date: "December 31, 2026",
        clauseId: "doc-1:sec-term",
        evidenceSectionId: "sec-term",
      },
    ],
  };

  it("renders the fixture with outline, viewer, and pager", async () => {
    mockAnalysisApi(ANALYSIS_PAYLOAD);
    const user = userEvent.setup();
    const document = addUpload({ fileName: "client.pdf", title: "Client agreement" });
    setDocumentStatus(document.id, "ready");
    renderWorkspace(document.id);
    expect(screen.getByRole("heading", { name: "Client agreement" })).toBeInTheDocument();
    expect(screen.getByText(/Contractor assigns to the Client/)).toBeInTheDocument();
    expect(screen.getByText("Section 1 of 11")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(screen.getByText("Section 2 of 11")).toBeInTheDocument();
  });

  it("renders validated Gemini findings with evidence and source jumps", async () => {
    mockAnalysisApi(ANALYSIS_PAYLOAD);
    const user = userEvent.setup();
    const document = addUpload({ fileName: "client.pdf", title: "Client agreement" });
    setDocumentStatus(document.id, "ready");
    renderWorkspace(document.id);
    expect(await screen.findByText("PlainTerms reviewed this document")).toBeInTheDocument();
    expect(screen.getByText("No late-payment fee")).toBeInTheDocument();
    expect(screen.queryByText(/high-risk|dangerous|illegal/i)).toBeNull();

    await user.click(screen.getByRole("button", { name: "Show evidence" }));
    // Scoped to the panel: the same sentence also appears in the viewer,
    // which is the point — evidence must match the source.
    const panel = screen.getByRole("complementary", {
      name: "PlainTerms intelligence panel",
    });
    expect(within(panel).getByText(/net thirty \(30\) days/)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "View in document" })[0] as HTMLElement);
    expect(screen.getByText("Section 3 of 11")).toBeInTheDocument();
  });

  it("shows the selected clause interpretation with a jump back", async () => {
    mockAnalysisApi(ANALYSIS_PAYLOAD);
    const user = userEvent.setup();
    const document = addUpload({ fileName: "client.pdf", title: "Client agreement" });
    setDocumentStatus(document.id, "ready");
    renderWorkspace(document.id);
    await screen.findByText("PlainTerms reviewed this document");
    await user.click(screen.getByRole("button", { name: /Payment Terms/ }));
    expect(
      await screen.findByText("The client pays monthly with a 30-day window."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Jump to source" }));
    expect(screen.getByText("Section 3 of 11")).toBeInTheDocument();
  });

  it("states temporary unavailability honestly with retry", async () => {
    mockAnalysisApi({ code: "ai-unavailable" }, 503);
    const user = userEvent.setup();
    const document = addUpload({ fileName: "client.pdf", title: "Client agreement" });
    renderWorkspace(document.id);
    expect(await screen.findByText("AI review is temporarily unavailable")).toBeInTheDocument();
    // The document itself stays fully readable.
    expect(screen.getByText(/Contractor assigns to the Client/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
  });

  it("explains unknown documents", () => {
    renderWorkspace("missing");
    expect(screen.getByRole("alert")).toHaveTextContent("doesn't exist");
  });

  it("renders real uploaded sections instead of fixture text", () => {
    resetStoreForTests([
      {
        id: "uploaded-1",
        title: "Real agreement",
        type: "service-agreement",
        status: "ready",
        pageCount: 2,
        parties: [],
        currentVersion: 1,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
        fixtureId: "upload",
        fileName: "real.pdf",
        isSample: false,
        sections: [
          {
            id: "sec-001-test-services",
            documentId: "uploaded-1",
            title: "1. Test Services",
            level: 1,
            pageNumber: 1,
            clauseIds: [],
            paragraphs: ["The Client will pay ZXQ-UPLOADED-9 for testing."],
          },
        ],
      },
    ]);
    renderWorkspace("uploaded-1");
    expect(screen.getByRole("heading", { name: "Real agreement" })).toBeInTheDocument();
    expect(screen.getByText(/ZXQ-UPLOADED-9/)).toBeInTheDocument();
    expect(screen.getByText("Section 1 of 1")).toBeInTheDocument();
  });
});
