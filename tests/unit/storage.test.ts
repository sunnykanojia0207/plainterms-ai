import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalTempStorage } from "@/lib/documents/storage";
import { clearRecords, deleteRecord, getRecord, saveRecord } from "@/lib/documents/records";
import type { ParsedRecord } from "@/lib/documents/records";

function record(overrides: Partial<ParsedRecord> = {}): ParsedRecord {
  const now = Date.now();
  return {
    id: "rec-1",
    title: "Test",
    type: "service-agreement",
    typeConfident: true,
    pageCount: 1,
    sections: [],
    warnings: [],
    createdAt: now,
    expiresAt: now + 60_000,
    ...overrides,
  };
}

describe("LocalTempStorage", () => {
  const storage = new LocalTempStorage("plainterms-test-uploads");

  it("stores, reads, checks, and deletes opaque blobs", async () => {
    const id = "test-doc-001";
    await storage.delete(id);
    expect(await storage.exists(id)).toBe(false);
    await storage.store(id, new Uint8Array([1, 2, 3]));
    expect(await storage.exists(id)).toBe(true);
    expect([...(await storage.read(id))]).toEqual([1, 2, 3]);
    await storage.delete(id);
    expect(await storage.exists(id)).toBe(false);
  });

  it("ignores missing deletes and rejects traversal ids", async () => {
    await expect(storage.delete("test-missing-xyz")).resolves.toBeUndefined();
    await expect(storage.store("../../evil", new Uint8Array([1]))).rejects.toThrow(
      /invalid document id/i,
    );
    await expect(storage.read("../../evil")).rejects.toThrow(/invalid document id/i);
  });
});

describe("parsed records", () => {
  beforeEach(() => {
    clearRecords();
  });

  it("saves, reads, and deletes records", () => {
    saveRecord(record());
    expect(getRecord("rec-1")?.title).toBe("Test");
    deleteRecord("rec-1");
    expect(getRecord("rec-1")).toBeNull();
  });

  it("expires stale records instead of serving them", () => {
    saveRecord(record({ id: "old", expiresAt: Date.now() - 1 }));
    expect(getRecord("old")).toBeNull();
  });
});

describe("upload transport", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps server failures to typed failures without content", async () => {
    const { uploadDocument } = await import("@/lib/documents/upload-client");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ code: "unreadable-file", message: "Damaged." }), {
            status: 422,
          }),
      ),
    );
    const file = new File(["x"], "a.pdf", { type: "application/pdf" });
    await expect(uploadDocument(file)).rejects.toMatchObject({
      kind: "unreadable-file",
      message: "Damaged.",
    });
  });

  it("maps unknown codes and network failures safely", async () => {
    const { uploadDocument } = await import("@/lib/documents/upload-client");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 500 })),
    );
    const file = new File(["x"], "a.pdf", { type: "application/pdf" });
    await expect(uploadDocument(file)).rejects.toMatchObject({
      kind: "processing-failed",
    });
  });
});
