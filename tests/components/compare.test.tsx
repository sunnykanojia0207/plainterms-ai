import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompareWorkspace } from "@/components/documents/CompareWorkspace";
import type { Comparison } from "@/lib/domain/types";

const PAYLOAD: Comparison = {
  id: "cmp-sample-service-agreement-v1-sample-service-agreement",
  leftDocumentId: "sample-service-agreement-v1",
  leftVersion: 1,
  rightDocumentId: "sample-service-agreement",
  rightVersion: 1,
  changes: [
    {
      id: "c1",
      type: "changed",
      clauseTitle: "Payment terms",
      category: "payment",
      importance: "high",
      leftRef: "3. Payment Terms · p. 2",
      rightRef: "3. Payment Terms · p. 2",
      leftSectionId: "sec-payment",
      rightSectionId: "sec-payment",
      leftText: "Invoices are payable net fifteen (15) days from receipt.",
      rightText: "Invoices are payable net thirty (30) days from receipt.",
      plainExplanation: "The payment window moved from net 15 to net 30.",
      whyItMatters: "The freelancer waits longer to be paid.",
      implication: "Cash flow arrives up to 15 days later.",
      materiality: "material",
      favors: "client",
      questionToConsider: "Was the longer window intentional?",
      recommendedNextStep: "Consider asking for net-15.",
      confidence: "high",
    },
    {
      id: "c2",
      type: "added",
      clauseTitle: "Extension option",
      category: "term",
      importance: "normal",
      leftRef: null,
      rightRef: "4. Term · p. 2",
      leftSectionId: null,
      rightSectionId: "sec-term",
      leftText: null,
      rightText: "The parties may extend the term by written agreement.",
      plainExplanation: "V2 adds an extension path.",
      whyItMatters: "Renewals are easier to arrange.",
      implication: "No practical downside.",
      materiality: "cosmetic",
      favors: "neutral",
      questionToConsider: "Do you want it?",
      recommendedNextStep: "No action needed.",
      confidence: "moderate",
    },
  ],
  silence: [
    {
      id: "s1",
      state: "removed",
      subject: "Late-payment interest",
      leftEvidence: {
        clauseId: "sample-service-agreement-v1:sec-payment",
        documentId: "sample-service-agreement-v1",
        sectionId: "sec-payment",
        location: "3. Payment Terms · p. 2",
        quote: "Late payments bear interest of 1.5% per month.",
        pageNumber: 2,
      },
      rightEvidence: null,
      whatWeKnow: "V1 charged interest on late payment.",
      whatRemainsUncertain: null,
      questionToConsider: "Was the interest removed intentionally?",
      confidence: "high",
    },
  ],
  unchangedCount: 4,
  summary: "PlainTerms identified 1 potentially important change between the two versions.",
  verdict: "Version 2 shifts payment timing risk to the freelancer.",
  verdictDrivers: ["Net 15 to net 30"],
};

describe("CompareWorkspace", () => {
  beforeEach(() => {
    // Intentionally no store reset: these tests rely on the seeded V1/V2
    // samples, and Vitest isolates modules per file. Session storage is
    // cleared so no cross-test documents leak in.
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  function mockCompare(payload: unknown, status = 200) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(payload), { status })),
    );
  }

  it("runs the comparison for the preselected samples and shows the verdict", async () => {
    mockCompare(PAYLOAD);
    render(<CompareWorkspace />);
    expect(
      await screen.findByText("Version 2 shifts payment timing risk to the freelancer."),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 potentially important change/)).toBeInTheDocument();
  });

  it("filters to potentially important changes and selects details with dual jumps", async () => {
    mockCompare(PAYLOAD);
    const user = userEvent.setup();
    render(<CompareWorkspace />);
    await screen.findByText("Version 2 shifts payment timing risk to the freelancer.");

    await user.selectOptions(screen.getByLabelText("Show"), "potentially-important");
    expect(screen.queryByText("Extension option")).toBeNull();
    expect(screen.getByLabelText("Change detail: Payment terms")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Payment terms/ }));
    const detail = screen.getByLabelText("Change detail: Payment terms");
    expect(within(detail).getByText(/net fifteen \(15\) days/)).toBeInTheDocument();
    expect(within(detail).getByText(/net thirty \(30\) days/)).toBeInTheDocument();
    const v1Jump = within(detail).getByRole("link", { name: /Jump to Version 1/ });
    const v2Jump = within(detail).getByRole("link", { name: /Jump to Version 2/ });
    expect(v1Jump).toHaveAttribute(
      "href",
      "/review/sample-service-agreement-v1#viewer-sec-payment",
    );
    expect(v1Jump).toHaveAttribute("target", "_blank");
    expect(v2Jump).toHaveAttribute("href", "/review/sample-service-agreement#viewer-sec-payment");
  });

  it("renders silence findings with distinct states and filters uncertain", async () => {
    mockCompare(PAYLOAD);
    const user = userEvent.setup();
    render(<CompareWorkspace />);
    await screen.findByText("Version 2 shifts payment timing risk to the freelancer.");
    expect(screen.getByText("Late-payment interest")).toBeInTheDocument();
    const silenceSection = screen.getByRole("region", { name: "Silence findings" });
    expect(within(silenceSection).getByText("Removed")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Show"), "uncertain");
    expect(screen.queryByText("Late-payment interest")).toBeNull();
    expect(screen.getByText("No changes match these filters")).toBeInTheDocument();
  });

  it("warns when both sides select the same document", async () => {
    mockCompare(PAYLOAD);
    const user = userEvent.setup();
    render(<CompareWorkspace />);
    await screen.findByText("Version 2 shifts payment timing risk to the freelancer.");
    const selects = screen.getAllByLabelText(/Version [12] ·/);
    const right = selects[1] as HTMLElement;
    await user.selectOptions(right, "sample-service-agreement-v1");
    expect(screen.getByText("Choose two different documents to compare.")).toBeInTheDocument();
  });

  it("states temporary unavailability with retry", async () => {
    mockCompare({ code: "ai-unavailable" }, 503);
    render(<CompareWorkspace />);
    expect(await screen.findByText("Comparison is temporarily unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
