/**
 * Plain-text parser. Decodes UTF-8 strictly, rejects binary masquerading
 * as text, and normalizes into sections via shared detection.
 */
import "server-only";
import { detectSections, splitParagraphs } from "@/lib/documents/parse/sections";
import { ParseError, type DocumentParser, type ParsedDocument } from "@/lib/documents/parse/types";

/** Fraction of control characters above which text is treated as binary. */
const MAX_CONTROL_RATIO = 0.05;

function looksBinary(text: string): boolean {
  let controls = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    // NUL byte: definitive binary signal.
    if (code === 0) {
      return true;
    }
    if (code < 32 && char !== "\n" && char !== "\r" && char !== "\t") {
      controls += 1;
    }
  }
  return text.length > 0 && controls / text.length > MAX_CONTROL_RATIO;
}

export function parseTxtBuffer(bytes: Uint8Array): ParsedDocument {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ParseError(
      "unreadable",
      "This file could not be read as text. Upload a UTF-8 encoded .txt file.",
    );
  }
  if (text.trim() === "") {
    throw new ParseError("empty", "This file contains no readable text.");
  }
  if (looksBinary(text)) {
    throw new ParseError("unreadable", "This file looks like binary data, not a text document.");
  }
  const blocks = splitParagraphs(text, 1);
  const sections = detectSections(blocks).map((section) => ({
    title: section.title,
    paragraphs: [...section.paragraphs],
    pageNumber: 1,
  }));
  if (sections.length === 0) {
    throw new ParseError("empty", "No readable sections were found in this file.");
  }
  return { sections, pageCount: 1, warnings: [] };
}

export const txtParser: DocumentParser = {
  kind: "txt",
  parse: (bytes: Uint8Array) => Promise.resolve(parseTxtBuffer(bytes)),
};
