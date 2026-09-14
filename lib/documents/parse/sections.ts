/**
 * Shared section detection: heading heuristics, block grouping, and stable
 * deterministic section ids. Used by the TXT and PDF parsers (DOCX carries
 * explicit headings from its markup). Deterministic: same bytes always
 * produce the same ids, which keeps Gemini evidence stable per version.
 */
import { DOCUMENT_LIMITS } from "@/lib/documents/limits";

export interface TextBlock {
  readonly text: string;
  readonly pageNumber: number;
  /** DOCX supplies real headings; PDF/TXT blocks start as paragraphs. */
  readonly kind: "heading" | "paragraph";
}

export interface DetectedSection {
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly pageNumber: number;
}

/** Split page text into paragraph blocks on blank lines. */
export function splitParagraphs(pageText: string, pageNumber: number): TextBlock[] {
  return pageText
    .split(/\r?\n\s*\r?\n/)
    .map((block) =>
      block
        .replace(/[ \t]+\n/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((block) => block !== "")
    .map((block) => ({ text: block, pageNumber, kind: "paragraph" as const }));
}

const NUMBERED_HEADING = /^(section\s+\d+|article\s+\d+|exhibit\s+[A-Z0-9]+|\d+(\.\d+)*\.)\s+\S/i;

function isAllCapsHeading(text: string): boolean {
  if (text.length < 4 || text.length > 80) {
    return false;
  }
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4) {
    return false;
  }
  return letters === letters.toUpperCase();
}

/** Conservative heading test: numbered, explicit, or short ALL-CAPS. */
export function isHeading(text: string): boolean {
  if (NUMBERED_HEADING.test(text)) {
    return true;
  }
  if (/[.!?]$/.test(text)) {
    return false;
  }
  return isAllCapsHeading(text);
}

/** URL-safe slug for stable section ids. */
export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug === "" ? "section" : slug;
}

/** Deterministic id: position + title slug. Same text always yields same ids. */
export function stableSectionId(index: number, title: string): string {
  return `sec-${String(index + 1).padStart(3, "0")}-${slugify(title)}`;
}

/**
 * Groups blocks into sections. Leading blocks before the first heading go
 * to an "Introduction" section. Caps applied per DOCUMENT_LIMITS.
 */
export function detectSections(blocks: readonly TextBlock[]): DetectedSection[] {
  interface MutableSection {
    title: string;
    paragraphs: string[];
    pageNumber: number;
  }
  const sections: MutableSection[] = [];
  let current: MutableSection | null = null;

  const startSection = (title: string, pageNumber: number): void => {
    if (sections.length >= DOCUMENT_LIMITS.maxSections) {
      return;
    }
    const next: MutableSection = { title, paragraphs: [], pageNumber };
    sections.push(next);
    current = next;
  };

  for (const block of blocks) {
    const heading = block.kind === "heading" || isHeading(block.text);
    if (heading) {
      startSection(block.text.slice(0, 160), block.pageNumber);
      continue;
    }
    if (current === null) {
      startSection("Introduction", block.pageNumber);
      current = sections[sections.length - 1] ?? null;
    }
    const target = current;
    if (target !== null && target.paragraphs.length < DOCUMENT_LIMITS.maxParagraphsPerSection) {
      target.paragraphs.push(block.text);
    }
  }

  return sections
    .map((section) => ({
      title: section.title,
      paragraphs: [...section.paragraphs],
      pageNumber: section.pageNumber,
    }))
    .filter((section) => section.paragraphs.length > 0);
}
