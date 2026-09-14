/**
 * Upload validation boundary — framework-agnostic so it runs identically
 * on the server and in unit tests. Magic-byte inspection and malware
 * scanning plug in here in the ingestion milestone.
 */

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

/** 25 MB — generous for contracts, bounded for safety. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export interface UploadCandidate {
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
}

export type UploadValidationIssue =
  | { readonly kind: "unsupported-type"; readonly detail: string }
  | { readonly kind: "too-large"; readonly detail: string }
  | { readonly kind: "empty"; readonly detail: string };

export function validateUpload(candidate: UploadCandidate): readonly UploadValidationIssue[] {
  const issues: UploadValidationIssue[] = [];
  if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(candidate.mimeType)) {
    issues.push({
      kind: "unsupported-type",
      detail: `“${candidate.fileName}” is a ${candidate.mimeType || "unknown"} file. PlainTerms reviews PDF, DOCX, and TXT files.`,
    });
  }
  if (candidate.sizeBytes <= 0) {
    issues.push({
      kind: "empty",
      detail: `“${candidate.fileName}” appears to be empty.`,
    });
  }
  if (candidate.sizeBytes > MAX_UPLOAD_BYTES) {
    issues.push({
      kind: "too-large",
      detail: `“${candidate.fileName}” exceeds the 25 MB limit.`,
    });
  }
  return issues;
}
