import { describe, expect, it } from "vitest";
import { PlainTermsActionPackService } from "@/lib/ai/action-pack-service";
import type { ActionPack } from "@/lib/domain/types";

const PACK: ActionPack = {
  documentId: "doc-1",
  items: [
    {
      id: "doc-1:pack-0",
      kind: "obligation",
      title: "Pay invoices on time",
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

describe("Action Pack export rendering", () => {
  it("renders Markdown sections from the same validated pack", async () => {
    const service = new PlainTermsActionPackService(() =>
      Promise.reject(new Error("Must not call the model for export.")),
    );
    const markdown = await service.renderExport(PACK, "markdown");
    expect(markdown).toContain("# Action Pack — doc-1");
    expect(markdown).toContain("## Key obligations");
    expect(markdown).toContain("## Information still needed");
    expect(markdown).toContain("Invoices are payable net thirty (30) days");
    expect(markdown).toContain("not legal advice");
    expect(markdown).not.toContain("undefined");
  });

  it("rejects unsupported formats explicitly", async () => {
    const service = new PlainTermsActionPackService(() =>
      Promise.reject(new Error("Must not call the model for export.")),
    );
    await expect(service.renderExport(PACK, "pdf")).rejects.toThrow(/unsupported/i);
  });
});
