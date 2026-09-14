import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Tabs } from "@/components/ui/Tabs";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { UploadZone } from "@/components/ui/UploadZone";
import { FeatureErrorBoundary } from "@/components/errors/error-boundary";

describe("Button", () => {
  it("activates with pointer and keyboard", async () => {
    const user = userEvent.setup();
    let clicks = 0;
    render(
      <Button
        onClick={() => {
          clicks += 1;
        }}
      >
        Review a document
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Review a document" });
    await user.click(button);
    button.focus();
    await user.keyboard("{Enter}");
    expect(clicks).toBe(2);
  });

  it("blocks interaction while disabled or loading", async () => {
    const user = userEvent.setup();
    let clicks = 0;
    const onClick = () => {
      clicks += 1;
    };
    const { rerender } = render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(clicks).toBe(0);
    rerender(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("aria-busy", "true");
  });

  it("renders an anchor when href is provided", () => {
    render(<Button href="/compare">Compare two versions</Button>);
    expect(screen.getByRole("link", { name: "Compare two versions" })).toHaveAttribute(
      "href",
      "/compare",
    );
  });
});

describe("Dialog", () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open dialog
        </button>
        <Dialog open={open} onClose={() => setOpen(false)} title="Settings">
          <button type="button">Inside</button>
        </Dialog>
      </>
    );
  }

  it("opens, traps focus, and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Settings" })).toBeNull();
    expect(screen.getByRole("button", { name: "Open dialog" })).toHaveFocus();
  });
});

describe("Tabs", () => {
  it("switches panels on click and arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        label="Groups"
        items={[
          { id: "a", label: "First", content: <p>First panel</p> },
          { id: "b", label: "Second", content: <p>Second panel</p> },
        ]}
      />,
    );
    expect(screen.getByText("First panel")).toBeInTheDocument();
    const secondTab = screen.getByRole("tab", { name: "Second" });
    await user.click(secondTab);
    expect(screen.getByText("Second panel")).toBeInTheDocument();
    expect(secondTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("Toast", () => {
  function Harness() {
    const { notify } = useToast();
    return (
      <button type="button" onClick={() => notify("Brief exported.")}>
        Export
      </button>
    );
  }

  it("announces notifications in a live region", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Brief exported.");
  });
});

describe("UploadZone", () => {
  it("reports files chosen through browse", async () => {
    const user = userEvent.setup();
    let received: readonly File[] = [];
    render(
      <UploadZone
        onFilesSelected={(files) => {
          received = files;
        }}
      />,
    );
    const file = new File(["fake pdf"], "agreement.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    await user.upload(input as HTMLInputElement, file);
    expect(received).toHaveLength(1);
    expect(received[0]?.name).toBe("agreement.pdf");
  });
});

describe("FeatureErrorBoundary", () => {
  function Exploding(): ReactNode {
    throw new Error("Simulated render crash with sensitive clause text.");
  }

  it("renders a recoverable state without leaking the crash", () => {
    render(
      <FeatureErrorBoundary scope="test">
        <Exploding />
      </FeatureErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("This didn't work");
    expect(document.body.textContent).not.toContain("sensitive clause text");
  });
});
