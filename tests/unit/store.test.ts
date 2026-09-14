import { beforeEach, describe, expect, it } from "vitest";
import {
  addUpload,
  clearUserDocuments,
  getDocumentById,
  removeDocument,
  resetStoreForTests,
  setDocumentStatus,
} from "@/lib/documents/store";

describe("document store", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetStoreForTests([]);
  });

  it("starts empty after an explicit reset", () => {
    expect(getDocumentById("anything")).toBeNull();
  });

  it("registers uploads as metadata only — never file contents", () => {
    const document = addUpload({ fileName: "client-agreement.pdf", title: "Client agreement" });
    expect(document.status).toBe("processing");
    expect(document.type).toBe("service-agreement");
    expect(document.fileName).toBe("client-agreement.pdf");
    expect(document).not.toHaveProperty("contents");
    expect(document).not.toHaveProperty("text");
    expect(document).not.toHaveProperty("bytes");
    expect(getDocumentById(document.id)?.title).toBe("Client agreement");
  });

  it("updates status and removes documents", () => {
    const document = addUpload({ fileName: "a.pdf", title: "A" });
    setDocumentStatus(document.id, "ready");
    expect(getDocumentById(document.id)?.status).toBe("ready");
    removeDocument(document.id);
    expect(getDocumentById(document.id)).toBeNull();
  });

  it("persists metadata across store reads within the tab", () => {
    const document = addUpload({ fileName: "b.pdf", title: "B" });
    const raw = window.sessionStorage.getItem("plainterms-documents-v1");
    expect(raw).toContain(document.id);
    expect(raw).not.toContain("contents");
  });

  it("clears only user uploads and reports the count", () => {
    const first = addUpload({ fileName: "a.pdf", title: "A" });
    const second = addUpload({ fileName: "b.pdf", title: "B" });
    expect(clearUserDocuments()).toBe(2);
    expect(getDocumentById(first.id)).toBeNull();
    expect(getDocumentById(second.id)).toBeNull();
    expect(clearUserDocuments()).toBe(0);
  });
});
