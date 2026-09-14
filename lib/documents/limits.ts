/**
 * Centralized document limits — the ONLY place ingestion bounds live.
 * Both client pre-checks and server enforcement import from here so the
 * numbers can never drift apart. All sizes in bytes unless noted.
 */

export const DOCUMENT_LIMITS = {
  /** Maximum uploaded file size (25 MB). */
  maxUploadBytes: 25 * 1024 * 1024,
  /** Maximum PDF pages to extract. */
  maxPages: 200,
  /** Maximum extracted text across all pages. */
  maxExtractedChars: 500_000,
  /** Maximum sections kept per document. */
  maxSections: 500,
  /** Maximum paragraphs kept per section. */
  maxParagraphsPerSection: 200,
  /** Wall-clock budget for one parse (validation + extraction). */
  processingTimeoutMs: 60_000,
  /** Parsed-record lifetime on the server. */
  recordTtlMs: 60 * 60 * 1000,
  /** Maximum records held server-side (FIFO eviction beyond this). */
  maxRecords: 100,
} as const;

export type DocumentLimits = typeof DOCUMENT_LIMITS;
