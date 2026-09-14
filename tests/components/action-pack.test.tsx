import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActionPackPanel } from "@/components/documents/ActionPackPanel";
import { ToastProvider } from "@/components/ui/Toast";
import type { ActionPack } from "@/lib/domain/types";

const PACK: ActionPack = {
  documentId: "doc-1",
  items: [
    {
      id: "doc-1:pack-0",
      kind: "obligation",
      title: "Pay monthly invoices",
      summary: "The client must pay monthly invoices within 30 days.",
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
      nextStep: "Consider calendaring invoice dates.",
    },
    {
      id: "doc-1:pack-1",
      kind: "lawyer",
      title: "Review the non-compete",
      summary: "Ask about the 12-month restriction scope.",
      priority: "high",
      evidence: {
        clauseId: "doc-1:sec-restrictions:1",
        documentId: "doc-1",
        sectionId: "sec-restrictions",
        location: "8. Restrictive Covenants · p. 4",
        quote: "For twelve (12) months following termination, the Contractor will not compete.",
        pageNumber: 4,
      },
      uncertainty: "Geographic scope is not stated.",
      nextStep: null,
    },
    {
      id: "doc-1:pack-2",
      kind: "checklist",
      title: "Confirm party details",
      summary: "Verify names and addresses before signing.",
      priority: "medium",
      evidence: null,
      uncertainty: null,
      nextStep: null,
    },
    {
      id: "doc-1:pack-3",
      kind: "info-needed",
      title: "Governing jurisdiction",
      summary: "The agreement does not identify a governing jurisdiction.",
      priority: "medium",
      evidence: null,
      uncertainty: "Not stated in the document.",
      nextStep: "Ask which jurisdiction applies.",
    },
  ],
};

describe("ActionPackPanel", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  function renderPanel() {
    return render(
      <ToastProvider>
        <ActionPackPanel
          documentId="doc-1"
          fixtureId="fixture"
          title="Agreement"
          version={1}
          onSelectSection={vi.fn()}
        />
      </ToastProvider>,
    );
  }

  function mockPack(payload: unknown, status = 200) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(payload), { status })),
    );
  }

  it("creates the pack and organizes it into tabs", async () => {
    mockPack({ pack: PACK, markdown: "# Action Pack" });
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Create Action Pack" }));
    expect(
      await screen.findByText("PlainTerms prepared this checklist from the document."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Obligations/ }));
    expect(screen.getByText("Pay monthly invoices")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Questions/ }));
    expect(
      screen.getByText("For discussion with a qualified legal professional"),
    ).toBeInTheDocument();
    expect(screen.getByText("Review the non-compete")).toBeInTheDocument();
  });

  it("jumps to source sections and toggles checklist items by keyboard", async () => {
    const onSelectSection = vi.fn();
    mockPack({ pack: PACK, markdown: "# Action Pack" });
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ActionPackPanel
          documentId="doc-1"
          fixtureId="fixture"
          title="Agreement"
          version={1}
          onSelectSection={onSelectSection}
        />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Create Action Pack" }));
    await screen.findByText("PlainTerms prepared this checklist from the document.");

    await user.click(screen.getByRole("tab", { name: /Obligations/ }));
    await user.click(screen.getByRole("button", { name: "View source" }));
    expect(onSelectSection).toHaveBeenCalledWith("sec-payment");

    await user.click(screen.getByRole("tab", { name: /Checklist/ }));
    const checkbox = screen.getByRole("checkbox", { name: "Confirm party details" });
    expect(checkbox).not.toBeChecked();
    checkbox.focus();
    await user.keyboard(" ");
    expect(checkbox).toBeChecked();
  });

  it("copies Markdown and prints, with PDF honestly disabled", async () => {
    const writeText = vi.fn(async () => {});
    const print = vi.fn();
    Object.defineProperty(window, "print", { value: print, configurable: true });
    mockPack({ pack: PACK, markdown: "# Action Pack — doc-1" });
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Create Action Pack" }));
    await screen.findByText("PlainTerms prepared this checklist from the document.");

    // Stub after render: the render pass resets jsdom navigator extensions,
    // so the clipboard stub must be installed at click time.
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("# Action Pack — doc-1");
    expect(await screen.findByText("Copied")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Print" }));
    expect(print).toHaveBeenCalled();

    const exportButton = screen.getByRole("button", { name: "Export PDF" });
    expect(exportButton).toBeDisabled();
  });

  it("shows error and unavailable states with retry", async () => {
    mockPack({ code: "ai-error" }, 502);
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Create Action Pack" }));
    expect(await screen.findByText("The pack didn't come back")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
  });

  it("shows the unavailable state when the service is down", async () => {
    mockPack({ code: "ai-unavailable" }, 503);
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Create Action Pack" }));
    expect(await screen.findByText("Action Pack is temporarily unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
