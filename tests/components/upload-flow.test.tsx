import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UploadFlow } from "@/components/documents/UploadFlow";
import { resetStoreForTests } from "@/lib/documents/store";
import type { UploadedRecord } from "@/lib/documents/upload-client";

describe("UploadFlow", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetStoreForTests([]);
    vi.unstubAllGlobals();
  });

  /**
   * Deterministic file selection: assigns files and fires a real change
   * event. (user-event's upload helper does not dispatch change on
   * visually-hidden inputs in jsdom; this tests our handler, not the
   * library. Real browsers are covered by the e2e journey.)
   */
  function selectFile(name: string, type: string, contents: string): void {
    const input = document.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("File input not found.");
    }
    const file = new File([contents], name, { type });
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });
    fireEvent.change(input);
  }

  function mockUpload(record: Partial<UploadedRecord> = {}, status = 200) {
    const payload = {
      document: {
        id: "doc-upload-1",
        title: "Client agreement",
        type: "service-agreement",
        typeConfident: true,
        pageCount: 3,
        fileName: "client-agreement.pdf",
        sizeBytes: 1024,
        sections: [],
        warnings: [],
        ...record,
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(payload), { status })),
    );
  }

  it("uploads a valid file and reports the server record", async () => {
    mockUpload();
    const user = userEvent.setup();
    const onUploaded = vi.fn();
    render(<UploadFlow onUploaded={onUploaded} />);
    selectFile("client-agreement.pdf", "application/pdf", "synthetic content");
    expect(screen.getByText("Client agreement")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Review document" }));
    // The uploading state is transient against an instant mock; the record
    // callback is the deterministic assertion. Slow-upload visuals are
    // covered by the loading-state markup assertions in e2e.
    await vi.waitFor(() => {
      expect(onUploaded).toHaveBeenCalledOnce();
    });
    const record = onUploaded.mock.calls[0]?.[0] as UploadedRecord;
    expect(record.id).toBe("doc-upload-1");
    expect(record.title).toBe("Client agreement");
  });

  it("shows server failures with recovery", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ code: "unreadable-file", message: "This file looks damaged." }),
            { status: 422 },
          ),
      ),
    );
    const user = userEvent.setup();
    render(<UploadFlow onUploaded={() => {}} />);
    selectFile("client-agreement.pdf", "application/pdf", "synthetic content");
    await user.click(screen.getByRole("button", { name: "Review document" }));
    expect(await screen.findByText("The upload didn't complete")).toBeInTheDocument();
    expect(screen.getByText("This file looks damaged.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Choose a different file" }));
    expect(screen.getByRole("button", { name: "Browse files" })).toBeInTheDocument();
  });

  it("explains unsupported files and lets the user remove a selection", async () => {
    const user = userEvent.setup();
    render(<UploadFlow onUploaded={() => {}} />);
    selectFile("setup.exe", "application/x-msdownload", "x");
    expect(screen.getByRole("alert")).toHaveTextContent("That file can't be reviewed");

    selectFile("terms.txt", "text/plain", "ok");
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("button", { name: "Browse files" })).toBeInTheDocument();
  });

  it("exposes a keyboard-reachable browse control", async () => {
    const user = userEvent.setup();
    render(<UploadFlow onUploaded={() => {}} />);
    const browse = screen.getByRole("button", { name: "Browse files" });
    browse.focus();
    expect(browse).toHaveFocus();
    await user.keyboard("{Enter}");
  });
});
