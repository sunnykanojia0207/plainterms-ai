import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewGuidePanel } from "@/components/documents/ReviewGuidePanel";
import { ToastProvider } from "@/components/ui/Toast";
import type { ReviewGuide } from "@/lib/domain/types";

const GUIDE: ReviewGuide = {
  documentId: "doc-1",
  compareDocumentId: null,
  items: [
    {
      id: "doc-1:guide-0",
      kind: "topic",
      documentId: "doc-1",
      title: "Payment timing",
      summary: "The 30-day window may deserve discussion.",
      priority: "high",
      evidence: {
        clauseId: "doc-1:sec-payment:0",
        documentId: "doc-1",
        sectionId: "sec-payment",
        location: "3. Payment Terms · p. 2",
        quote: "Invoices are payable net thirty (30) days from receipt.",
        pageNumber: 2,
      },
      uncertainty: null,
    },
    {
      id: "doc-1:guide-1",
      kind: "lawyer-question",
      documentId: "doc-1",
      title: "Review the restriction",
      summary: "How should the restriction be understood in context?",
      priority: "high",
      evidence: {
        clauseId: "doc-1:sec-restrictions:1",
        documentId: "doc-1",
        sectionId: "sec-restrictions",
        location: "8. Restrictive Covenants · p. 4",
        quote: "For twelve (12) months following termination.",
        pageNumber: 4,
      },
      uncertainty: "Geographic scope is not stated.",
    },
    {
      id: "doc-1:guide-2",
      kind: "checklist",
      documentId: "doc-1",
      title: "Confirm payment timing",
      summary: "Confirm the 30-day payment timing before signing.",
      priority: "medium",
      evidence: {
        clauseId: "doc-1:sec-payment:2",
        documentId: "doc-1",
        sectionId: "sec-payment",
        location: "3. Payment Terms · p. 2",
        quote: "Invoices are payable net thirty (30) days from receipt.",
        pageNumber: 2,
      },
      uncertainty: null,
    },
  ],
};

describe("ReviewGuidePanel", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  function renderPanel(onSelectSection = vi.fn()) {
    return {
      onSelectSection,
      ...render(
        <ToastProvider>
          <ReviewGuidePanel
            documentId="doc-1"
            fixtureId="fixture"
            title="Agreement"
            version={1}
            onSelectSection={onSelectSection}
          />
        </ToastProvider>,
      ),
    };
  }

  function mockGuide(payload: unknown, status = 200) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(payload), { status })),
    );
  }

  it("creates the guide and organizes it into tabs", async () => {
    mockGuide({ guide: GUIDE, markdown: "# Review Guide" });
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Review Guide" }));
    expect(await screen.findByText(/PlainTerms prepared this guide/)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Discuss/ }));
    expect(screen.getByText("Payment timing")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Questions/ }));
    const counsel = screen.getByText("For discussion with a qualified legal professional");
    expect(counsel).toBeInTheDocument();
    expect(screen.getByText("Review the restriction")).toBeInTheDocument();
  });

  it("jumps to source sections from guide items", async () => {
    mockGuide({ guide: GUIDE, markdown: "# Review Guide" });
    const user = userEvent.setup();
    const { onSelectSection } = renderPanel();
    await user.click(screen.getByRole("button", { name: "Review Guide" }));
    await screen.findByText(/PlainTerms prepared this guide/);
    await user.click(screen.getByRole("tab", { name: /Discuss/ }));
    await user.click(screen.getAllByRole("button", { name: "View source" })[0] as HTMLElement);
    expect(onSelectSection).toHaveBeenCalledWith("sec-payment");
  });

  it("opens compared-document evidence in a new tab", async () => {
    const compared: ReviewGuide = {
      ...GUIDE,
      compareDocumentId: "v1-doc",
      items: GUIDE.items.map((item) => ({
        ...item,
        documentId: "v1-doc",
        evidence: item.evidence === null ? null : { ...item.evidence, documentId: "v1-doc" },
      })),
    };
    mockGuide({ guide: compared, markdown: "# Review Guide" });
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Review Guide" }));
    await screen.findByText(/PlainTerms prepared this guide/);
    await user.click(screen.getByRole("tab", { name: /Discuss/ }));
    const jump = screen.getAllByRole("link", { name: /View source in compared document/ })[0];
    expect(jump).toBeDefined();
    expect(jump).toHaveAttribute("href", "/review/v1-doc#viewer-sec-payment");
    expect(jump).toHaveAttribute("target", "_blank");
    void user;
  });

  it("copies the guide and keeps PDF export honestly disabled", async () => {
    const writeText = vi.fn(async () => {});
    mockGuide({ guide: GUIDE, markdown: "# Review Guide — doc-1" });
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Review Guide" }));
    await screen.findByText(/PlainTerms prepared this guide/);

    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    await user.click(screen.getByRole("button", { name: "Copy all" }));
    expect(writeText).toHaveBeenCalledWith("# Review Guide — doc-1");

    await user.click(screen.getByRole("button", { name: "Print" }));
    expect(screen.getByRole("button", { name: "Export PDF" })).toBeDisabled();
  });

  it("shows error and unavailable states with retry", async () => {
    mockGuide({ code: "ai-error" }, 502);
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Review Guide" }));
    expect(await screen.findByText("The guide didn't come back")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
  });

  it("shows the unavailable state when the service is down", async () => {
    mockGuide({ code: "ai-unavailable" }, 503);
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Review Guide" }));
    expect(await screen.findByText("Review Guide is temporarily unavailable")).toBeInTheDocument();
  });
});
