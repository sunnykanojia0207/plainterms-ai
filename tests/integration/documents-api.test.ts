/**
 * Ingestion pipeline tests: real fixture bytes through processUploadFile —
 * validation, magic-byte sniffing, parsing, records, cleanup. The HTTP
 * adapter itself is covered by e2e with real browser uploads.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { processUploadFile } from "@/lib/documents/ingest";
import { clearRecords, getRecord } from "@/lib/documents/records";

const FIXTURES = join(process.cwd(), "tests", "fixtures");

function fixtureBytes(name: string): Uint8Array {
  return new Uint8Array(readFileSync(join(FIXTURES, name)));
}

function uploadOf(name: string, mimeType: string, bytes?: Uint8Array) {
  const data = bytes ?? fixtureBytes(name);
  return {
    fileName: name,
    mimeType,
    sizeBytes: data.length,
    bytes: data,
  };
}

describe("processUploadFile", () => {
  afterEach(() => {
    clearRecords();
  });

  it("ingests a real TXT file with sections and a record", async () => {
    const result = await processUploadFile(uploadOf("sample-agreement.txt", "text/plain"), "req-1");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.document.title).toContain("Sample agreement");
    expect(result.document.type).toBe("service-agreement");
    const text = result.document.sections.flatMap((section) => section.paragraphs).join("\n");
    expect(text).toContain("ZXQ-TEST-7741");
    expect(getRecord(result.document.id)?.title).toBe(result.document.title);
    for (const section of result.document.sections) {
      expect(section.documentId).toBe(result.document.id);
      expect(section.id).toMatch(/^sec-\d{3}-/);
    }
  });

  it("ingests real PDF and DOCX files", async () => {
    const pdf = await processUploadFile(
      uploadOf("sample-agreement.pdf", "application/pdf"),
      "req-2",
    );
    expect(pdf.ok).toBe(true);
    if (!pdf.ok) {
      return;
    }
    expect(pdf.document.sections.flatMap((section) => section.paragraphs).join("\n")).toContain(
      "ZXQ-TEST-7741",
    );
    expect(pdf.document.pageCount).toBeGreaterThanOrEqual(1);

    const docx = await processUploadFile(
      uploadOf(
        "sample-agreement.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
      "req-3",
    );
    expect(docx.ok).toBe(true);
  });

  it("rejects spoofed, empty, and oversized files", async () => {
    const exe = await processUploadFile(
      {
        fileName: "contract.pdf",
        mimeType: "application/pdf",
        sizeBytes: 4,
        bytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]),
      },
      "req-4",
    );
    expect(exe).toMatchObject({ ok: false, code: "unsupported-file" });

    const empty = await processUploadFile(
      {
        fileName: "notes.txt",
        mimeType: "text/plain",
        sizeBytes: 0,
        bytes: new Uint8Array(0),
      },
      "req-5",
    );
    expect(empty).toMatchObject({ ok: false, code: "empty-file" });

    const big = await processUploadFile(
      {
        fileName: "big.pdf",
        mimeType: "application/pdf",
        sizeBytes: 26 * 1024 * 1024,
        bytes: new Uint8Array(26 * 1024 * 1024),
      },
      "req-6",
    );
    expect(big).toMatchObject({ ok: false, code: "too-large" });

    const wrongExt = await processUploadFile(
      uploadOf("sample-agreement.txt", "text/plain"),
      "req-7",
    );
    expect(wrongExt.ok).toBe(true);
  });

  it("rejects corrupt PDFs", async () => {
    const corrupt = await processUploadFile(
      {
        fileName: "bad.pdf",
        mimeType: "application/pdf",
        sizeBytes: 26,
        bytes: new TextEncoder().encode("%PDF-1.4 {{{ not a real file"),
      },
      "req-8",
    );
    expect(corrupt.ok).toBe(false);
    if (!corrupt.ok) {
      expect(["unreadable-file", "no-text"]).toContain(corrupt.code);
    }
  });

  it("rejects unsupported extensions before sniffing", async () => {
    const result = await processUploadFile(
      {
        fileName: "setup.exe",
        mimeType: "application/x-msdownload",
        sizeBytes: 4,
        bytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]),
      },
      "req-9",
    );
    expect(result).toMatchObject({ ok: false, code: "unsupported-file" });
  });
});
