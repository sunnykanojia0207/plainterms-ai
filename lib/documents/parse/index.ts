/**
 * Parser selection: extension allowlist plus magic-byte sniffing, so a
 * renamed executable or zip can never reach the wrong parser. Sniffing
 * never trusts the filename alone.
 */
import "server-only";
import { docxParser } from "@/lib/documents/parse/docx";
import { pdfParser } from "@/lib/documents/parse/pdf";
import { txtParser } from "@/lib/documents/parse/txt";
import type { DocumentParser, ParsedFileKind } from "@/lib/documents/parse/types";

const PARSERS: Record<ParsedFileKind, DocumentParser> = {
  pdf: pdfParser,
  docx: docxParser,
  txt: txtParser,
};

export function selectParser(kind: ParsedFileKind): DocumentParser {
  return PARSERS[kind];
}

function isPdfMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function isZipMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  );
}

function looksTextual(bytes: Uint8Array): boolean {
  const sample = bytes.slice(0, 4096);
  let controls = 0;
  for (const byte of sample) {
    if (byte === 0) {
      return false;
    }
    if (byte < 32 && byte !== 10 && byte !== 13 && byte !== 9) {
      controls += 1;
    }
  }
  return sample.length === 0 || controls / sample.length < 0.05;
}

/**
 * Sniffs the real file kind from magic bytes. Extension is checked
 * separately by the upload route; a mismatch rejects the upload.
 */
export function sniffKind(bytes: Uint8Array, fileName: string): ParsedFileKind | null {
  if (isPdfMagic(bytes)) {
    return "pdf";
  }
  if (isZipMagic(bytes) && fileName.toLowerCase().endsWith(".docx")) {
    return "docx";
  }
  if (looksTextual(bytes) && /\.(txt|md|text)$/i.test(fileName)) {
    return "txt";
  }
  return null;
}
