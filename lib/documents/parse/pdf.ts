/**
 * PDF parser (unpdf/PDF.js, text layer only). Groups positioned text items
 * into lines and paragraphs by geometry, preserving page boundaries,
 * section order, and page numbers for evidence. Image-only PDFs yield no
 * text — reported honestly, never faked. No OCR.
 */
import "server-only";
import { extractTextItems, getDocumentProxy } from "unpdf";
import { DOCUMENT_LIMITS } from "@/lib/documents/limits";
import { detectSections, isHeading, type TextBlock } from "@/lib/documents/parse/sections";
import { ParseError, type DocumentParser, type ParsedDocument } from "@/lib/documents/parse/types";

function mapPdfError(error: unknown): ParseError {
  const message = error instanceof Error ? error.message : String(error);
  if (/password|decrypt|encrypt/i.test(message)) {
    return new ParseError(
      "protected",
      "This PDF is password-protected. Remove the password and upload it again.",
    );
  }
  return new ParseError(
    "corrupt",
    "This PDF couldn't be read. It may be damaged or in an unsupported format.",
  );
}

interface PositionedItem {
  readonly str: string;
  readonly x: number;
  readonly y: number;
}

/**
 * Groups positioned items into paragraph blocks: items join lines by Y,
 * headings always stand alone (so section detection sees them), and body
 * lines split only on large vertical gaps. Small gaps join wrapped lines.
 */
export function groupItemsIntoBlocks(
  items: readonly PositionedItem[],
  pageNumber: number,
): TextBlock[] {
  const sorted = [...items]
    .filter((item) => item.str.trim() !== "")
    .sort((a, b) => b.y - a.y || a.x - b.x);
  if (sorted.length === 0) {
    return [];
  }

  const lines: { text: string; y: number }[] = [];
  for (const item of sorted) {
    const last = lines[lines.length - 1];
    if (last !== undefined && Math.abs(last.y - item.y) <= 2) {
      last.text += ` ${item.str.trim()}`;
    } else {
      lines.push({ text: item.str.trim(), y: item.y });
    }
  }

  const gaps: number[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const current = lines[index];
    const previous = lines[index - 1];
    if (current !== undefined && previous !== undefined) {
      gaps.push(previous.y - current.y);
    }
  }
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)] ?? 14;
  const breakThreshold = Math.max(medianGap * 1.6, 10);

  const blocks: TextBlock[] = [];
  let current: { text: string; y: number }[] = [];
  const flush = (): void => {
    if (current.length > 0) {
      blocks.push({
        text: current.map((line) => line.text).join(" "),
        pageNumber,
        kind: "paragraph",
      });
      current = [];
    }
  };

  lines.forEach((line, index) => {
    if (isHeading(line.text)) {
      flush();
      blocks.push({ text: line.text, pageNumber, kind: "paragraph" });
      return;
    }
    if (index > 0) {
      const gap = gaps[index - 1] ?? 0;
      if (gap > breakThreshold && current.length > 0) {
        flush();
      }
    }
    current.push(line);
  });
  flush();

  return blocks
    .map((block) => ({ ...block, text: block.text.replace(/\s+/g, " ").trim() }))
    .filter((block) => block.text !== "");
}

export async function parsePdfBuffer(bytes: Uint8Array): Promise<ParsedDocument> {
  let proxy: Awaited<ReturnType<typeof getDocumentProxy>> | null = null;
  const destroy = (): void => {
    if (proxy === null) {
      return;
    }
    const destroyable = proxy as unknown as { destroy?: unknown };
    if (typeof destroyable.destroy === "function") {
      (destroyable.destroy as () => void)();
    }
  };
  try {
    proxy = await getDocumentProxy(bytes);
    if (proxy.numPages > DOCUMENT_LIMITS.maxPages) {
      throw new ParseError(
        "too-large",
        `This PDF has ${proxy.numPages} pages, above the ${DOCUMENT_LIMITS.maxPages}-page limit.`,
      );
    }
    const { totalPages, items } = await extractTextItems(proxy);
    const blocks: TextBlock[] = [];
    let totalChars = 0;
    items.forEach((pageItems, pageIndex) => {
      const pageBlocks = groupItemsIntoBlocks(pageItems, pageIndex + 1);
      for (const block of pageBlocks) {
        totalChars += block.text.length;
        if (totalChars > DOCUMENT_LIMITS.maxExtractedChars) {
          throw new ParseError(
            "too-large",
            "This document contains more text than can be processed. Try a shorter file.",
          );
        }
        blocks.push(block);
      }
    });

    if (blocks.length === 0) {
      throw new ParseError(
        "no-text",
        "Text could not be extracted from this PDF. It may be a scanned image — try a text-based PDF instead.",
      );
    }

    const sections = detectSections(blocks).map((section) => ({
      title: section.title,
      paragraphs: [...section.paragraphs],
      pageNumber: section.pageNumber,
    }));
    if (sections.length === 0) {
      throw new ParseError("empty", "No readable sections were found in this PDF.");
    }
    return { sections, pageCount: totalPages, warnings: [] };
  } catch (error) {
    if (error instanceof ParseError) {
      throw error;
    }
    throw mapPdfError(error);
  } finally {
    destroy();
  }
}

export const pdfParser: DocumentParser = {
  kind: "pdf",
  parse: parsePdfBuffer,
};
