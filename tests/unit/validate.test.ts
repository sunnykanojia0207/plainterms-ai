import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateUpload } from "@/lib/security/validate";

describe("validateUpload", () => {
  it("accepts PDF, DOCX, and TXT within the size limit", () => {
    expect(
      validateUpload({
        fileName: "agreement.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
      }),
    ).toEqual([]);
    expect(
      validateUpload({
        fileName: "agreement.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sizeBytes: 2048,
      }),
    ).toEqual([]);
    expect(
      validateUpload({
        fileName: "notes.txt",
        mimeType: "text/plain",
        sizeBytes: 512,
      }),
    ).toEqual([]);
  });

  it("rejects executable and other unsupported types", () => {
    const issues = validateUpload({
      fileName: "setup.exe",
      mimeType: "application/x-msdownload",
      sizeBytes: 1024,
    });
    expect(issues.some((issue) => issue.kind === "unsupported-type")).toBe(true);
  });

  it("rejects files over the size limit and empty files", () => {
    const tooLarge = validateUpload({
      fileName: "huge.pdf",
      mimeType: "application/pdf",
      sizeBytes: MAX_UPLOAD_BYTES + 1,
    });
    expect(tooLarge.some((issue) => issue.kind === "too-large")).toBe(true);

    const empty = validateUpload({
      fileName: "empty.pdf",
      mimeType: "application/pdf",
      sizeBytes: 0,
    });
    expect(empty.some((issue) => issue.kind === "empty")).toBe(true);
  });
});
