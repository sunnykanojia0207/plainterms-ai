/**
 * Ingestion core: validated upload bytes in, normalized record out.
 * Pure pipeline logic (no HTTP): the API route adapts multipart input to
 * this function and maps its result to responses. Fully unit-testable
 * without HTTP machinery.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { DOCUMENT_LIMITS } from "@/lib/documents/limits";
import { selectParser, sniffKind } from "@/lib/documents/parse";
import type { ParsedFileKind } from "@/lib/documents/parse/types";
import { ParseError } from "@/lib/documents/parse/types";
import { saveRecord } from "@/lib/documents/records";
import { LocalTempStorage } from "@/lib/documents/storage";
import { detectDocumentType } from "@/lib/documents/type-detect";
import { stableSectionId } from "@/lib/documents/parse/sections";
import type { FixtureSection } from "@/lib/documents/fixture";
import { logger } from "@/lib/privacy/log";

export const ALLOWED_EXTENSIONS: Record<string, ParsedFileKind> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".txt": "txt",
};

export interface UploadInput {
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly bytes: Uint8Array;
}

export interface IngestedDocument {
  readonly id: string;
  readonly title: string;
  readonly type: "service-agreement" | "nda" | "statement-of-work";
  readonly typeConfident: boolean;
  readonly pageCount: number;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly sections: readonly FixtureSection[];
  readonly warnings: readonly string[];
}

export type IngestFailureCode =
  | "unsupported-file"
  | "too-large"
  | "empty-file"
  | "unreadable-file"
  | "protected-file"
  | "no-text"
  | "processing-timeout"
  | "processing-failed";

export type IngestResult =
  | { readonly ok: true; readonly document: IngestedDocument }
  | { readonly ok: false; readonly code: IngestFailureCode; readonly message: string };

const PARSE_CODE: Record<string, IngestFailureCode> = {
  "unsupported-type": "unsupported-file",
  "too-large": "too-large",
  empty: "empty-file",
  corrupt: "unreadable-file",
  protected: "protected-file",
  unreadable: "unreadable-file",
  "no-text": "no-text",
  timeout: "processing-timeout",
  "storage-failure": "processing-failed",
};

export function extensionOf(fileName: string): ParsedFileKind | null {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) {
    return null;
  }
  const extension = fileName.slice(dot).toLowerCase();
  return ALLOWED_EXTENSIONS[extension] ?? null;
}

export function titleFromFileName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const base = (dot > 0 ? fileName.slice(0, dot) : fileName).replace(/[-_]+/g, " ").trim();
  const titled = base.charAt(0).toUpperCase() + base.slice(1);
  return titled === "" ? "Untitled document" : titled.slice(0, 160);
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new ParseError("timeout", "Processing took too long. Try a smaller file.")),
      ms,
    );
  });
  return Promise.race([work, timeout]).finally(() => {
    if (timer !== null) {
      clearTimeout(timer);
    }
  });
}

/**
 * Validates, sniffs, parses, normalizes, and records one upload.
 * Raw bytes are zeroed after the temp copy; temp files are always
 * deleted; failures carry user-safe messages and machine codes.
 */
export async function processUploadFile(
  input: UploadInput,
  requestId: string,
): Promise<IngestResult> {
  const fileName = input.fileName || "upload";
  const extension = extensionOf(fileName);
  if (extension === null) {
    return {
      ok: false,
      code: "unsupported-file",
      message: `“${fileName}” is not a supported type. Upload a PDF, DOCX, or TXT file.`,
    };
  }
  if (input.sizeBytes <= 0 || input.bytes.length === 0) {
    return {
      ok: false,
      code: "empty-file",
      message: `“${fileName}” appears to be empty.`,
    };
  }
  if (
    input.sizeBytes > DOCUMENT_LIMITS.maxUploadBytes ||
    input.bytes.length > DOCUMENT_LIMITS.maxUploadBytes
  ) {
    return {
      ok: false,
      code: "too-large",
      message: `“${fileName}” exceeds the 25 MB limit.`,
    };
  }

  const sniffed = sniffKind(input.bytes, fileName);
  if (sniffed === null || sniffed !== extension) {
    return {
      ok: false,
      code: "unsupported-file",
      message: `“${fileName}” does not look like a ${extension.toUpperCase()} file. The extension may be wrong.`,
    };
  }

  const storage = new LocalTempStorage();
  const tempId = randomUUID();
  try {
    try {
      await storage.store(tempId, input.bytes);
    } catch {
      throw new ParseError("storage-failure", "The upload could not be stored. Try again.");
    }
    input.bytes.fill(0);

    const stored = await storage.read(tempId);
    const parsed = await withTimeout(
      selectParser(extension).parse(stored),
      DOCUMENT_LIMITS.processingTimeoutMs,
    );

    const fullText = parsed.sections.flatMap((section) => section.paragraphs).join("\n");
    const detection = detectDocumentType(fullText);
    const recordId = randomUUID();
    const sections: FixtureSection[] = parsed.sections.map((section, index) => ({
      id: stableSectionId(index, section.title),
      documentId: recordId,
      title: section.title,
      level: 1,
      pageNumber: section.pageNumber,
      clauseIds: [],
      paragraphs: [...section.paragraphs],
    }));

    saveRecord({
      id: recordId,
      title: titleFromFileName(fileName),
      type: detection.type,
      typeConfident: detection.confident,
      pageCount: parsed.pageCount,
      sections,
      warnings: [...parsed.warnings],
      createdAt: Date.now(),
      expiresAt: Date.now() + DOCUMENT_LIMITS.recordTtlMs,
    });

    logger.info("Document ingested", {
      requestId,
      kind: extension,
      pages: parsed.pageCount,
      sections: sections.length,
      typeConfident: detection.confident,
    });

    return {
      ok: true,
      document: {
        id: recordId,
        title: titleFromFileName(fileName),
        type: detection.type,
        typeConfident: detection.confident,
        pageCount: parsed.pageCount,
        fileName,
        sizeBytes: input.sizeBytes,
        sections,
        warnings: [...parsed.warnings],
      },
    };
  } catch (error) {
    if (error instanceof ParseError) {
      return {
        ok: false,
        code: PARSE_CODE[error.code] ?? "processing-failed",
        message: error.message,
      };
    }
    logger.error("Document upload failed unexpectedly", { requestId });
    return {
      ok: false,
      code: "processing-failed",
      message: "Something went wrong. Try again.",
    };
  } finally {
    await storage.delete(tempId);
  }
}
