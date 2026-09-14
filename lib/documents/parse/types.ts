/**
 * Parser contracts. Parsers convert untrusted file bytes into plain
 * section/paragraph structures. They never execute, fetch, or render
 * anything embedded — output is data for normalization and display.
 */

export type ParsedFileKind = "pdf" | "docx" | "txt";

export interface ParsedSection {
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly pageNumber: number;
}

export interface ParsedDocument {
  readonly sections: readonly ParsedSection[];
  readonly pageCount: number;
  /** Non-fatal notes (e.g. skipped tables, flattened lists). */
  readonly warnings: readonly string[];
}

export type ParseFailureCode =
  | "unsupported-type"
  | "too-large"
  | "empty"
  | "corrupt"
  | "protected"
  | "unreadable"
  | "no-text"
  | "timeout"
  | "storage-failure";

export class ParseError extends Error {
  readonly code: ParseFailureCode;

  constructor(code: ParseFailureCode, message: string) {
    super(message);
    this.name = "ParseError";
    this.code = code;
  }
}

export interface DocumentParser {
  readonly kind: ParsedFileKind;
  parse(bytes: Uint8Array): Promise<ParsedDocument>;
}
