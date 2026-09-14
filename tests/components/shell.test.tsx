import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/components/shell/providers";
import { TopNav } from "@/components/shell/TopNav";

function renderNav() {
  return render(
    <AppProviders>
      <TopNav />
    </AppProviders>,
  );
}

describe("TopNav", () => {
  it("renders all five primary destinations with correct targets", async () => {
    renderNav();
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const targets: Record<string, string> = {
      Home: "/",
      Documents: "/documents",
      Review: "/review",
      Compare: "/compare",
      Ask: "/ask",
    };
    for (const [label, href] of Object.entries(targets)) {
      const candidates = screen.getAllByRole("link", { name: label });
      const match = candidates.find((candidate) => candidate.getAttribute("href") === href);
      expect(match, `${label} should link to ${href}`).toBeDefined();
    }
    expect(nav).toBeInTheDocument();
  });

  it("exposes a skip link to the main content", () => {
    renderNav();
    const skip = screen.getByRole("link", { name: "Skip to main content" });
    expect(skip).toHaveAttribute("href", "#main-content");
  });

  it("opens the settings sheet and persists a theme change", async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole("button", { name: "Open settings" }));
    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    expect(dialog).toBeInTheDocument();

    const themeSelect = screen.getByLabelText("Theme");
    await user.selectOptions(themeSelect, "dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("plainterms-theme")).toBe("dark");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Settings" })).toBeNull();
  });

  it("opens the command menu with Ctrl+K and filters workspaces", async () => {
    const user = userEvent.setup();
    renderNav();
    await user.keyboard("{Control>}k{/Control}");
    const dialog = await screen.findByRole("dialog", { name: "Go to" });
    expect(dialog).toBeInTheDocument();

    await user.type(screen.getByLabelText("Filter workspaces"), "comp");
    expect(screen.getByRole("option", { name: /Compare/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Documents/ })).toBeNull();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Go to" })).toBeNull();
  });

  it("opens the mobile navigation drawer", async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole("button", { name: "Open navigation menu" }));
    const dialog = await screen.findByRole("dialog", { name: "PlainTerms" });
    expect(dialog).toBeInTheDocument();
    expect(dialog.querySelector('a[href="/compare"]')?.textContent).toContain("Compare");
  });

  it("delete-my-documents removes uploads and keeps samples", async () => {
    const { addUpload, getDocumentById, resetStoreForTests } =
      await import("@/lib/documents/store");
    window.sessionStorage.clear();
    resetStoreForTests([]);
    const uploaded = addUpload({ fileName: "temp.pdf", title: "Temp" });
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole("button", { name: "Open settings" }));
    await screen.findByRole("dialog", { name: "Settings" });
    await user.click(screen.getByRole("button", { name: "Delete my documents" }));
    expect(await screen.findByText(/Deleted 1 uploaded document/)).toBeInTheDocument();
    expect(getDocumentById(uploaded.id)).toBeNull();
  });
});
