"use client";

/**
 * Upload transport: posts a File to the ingestion endpoint and maps the
 * response onto store-ready metadata. No parsing here — the server owns
 * validation, extraction, and normalization.
 */
import type { FixtureSection } from "@/lib/documents/fixture";

export interface UploadedRecord {
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

export type UploadFailureKind =
  | "unsupported-file"
  | "too-large"
  | "empty-file"
  | "unreadable-file"
  | "protected-file"
  | "no-text"
  | "processing-timeout"
  | "processing-failed"
  | "rate-limited"
  | "missing-file";

export interface UploadFailure {
  readonly kind: UploadFailureKind;
  readonly message: string;
}

const KNOWN_CODES: readonly string[] = [
  "unsupported-file",
  "too-large",
  "empty-file",
  "unreadable-file",
  "protected-file",
  "no-text",
  "processing-timeout",
  "processing-failed",
  "rate-limited",
  "missing-file",
];

export async function uploadDocument(file: File, signal?: AbortSignal): Promise<UploadedRecord> {
  const form = new FormData();
  form.append("file", file, file.name);
  let response: Response;
  try {
    response = await fetch("/api/documents", {
      method: "POST",
      body: form,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw {
      kind: "processing-failed",
      message: "The upload couldn't reach the server. Check your connection and try again.",
    } satisfies UploadFailure;
  }
  if (response.ok) {
    const payload = (await response.json()) as { document: UploadedRecord };
    return payload.document;
  }
  const problem = (await response.json().catch(() => null)) as {
    code?: string;
    message?: string;
  } | null;
  const code = problem?.code ?? "processing-failed";
  const kind: UploadFailureKind = (KNOWN_CODES as readonly string[]).includes(code)
    ? (code as UploadFailureKind)
    : "processing-failed";
  throw {
    kind,
    message:
      typeof problem?.message === "string" && problem.message !== ""
        ? problem.message
        : "Something went wrong. Try again.",
  } satisfies UploadFailure;
}

export function isUploadFailure(error: unknown): error is UploadFailure {
  return typeof error === "object" && error !== null && "kind" in error && "message" in error;
}
