/**
 * DOCX parser (mammoth: document.xml text only). Headings, paragraphs,
 * lists, and simple tables are preserved in order; macros, embedded
 * objects, scripts, and styles are never executed or rendered — the HTML
 * is tokenized as plain strings and all tags are stripped from text.
 */
import "server-only";
import mammoth from "mammoth";
import { detectSections, type TextBlock } from "@/lib/documents/parse/sections";
import { ParseError, type DocumentParser, type ParsedDocument } from "@/lib/documents/parse/types";

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)));
}

function stripTags(fragment: string): string {
  // Defensive: drop any script/style content even though mammoth never emits it.
  const withoutScripts = fragment
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  return decodeEntities(withoutScripts.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenizes mammoth HTML into ordered blocks. Tables flatten to
 * "cell | cell" rows; list items keep a bullet marker.
 */
export function htmlToBlocks(html: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const tokenPattern =
    /<(h[1-6]|p|li)(\s[^>]*)?>([\s\S]*?)<\/\1>|<(table)(\s[^>]*)?>([\s\S]*?)<\/table>/gi;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(html)) !== null) {
    const tag = (match[1] ?? match[4] ?? "").toLowerCase();
    const inner = match[3] ?? match[6] ?? "";
    if (tag === "table") {
      const rows = inner.match(/<tr(\s[^>]*)?>([\s\S]*?)<\/tr>/gi) ?? [];
      for (const row of rows) {
        const cells = [...row.matchAll(/<t[dh](\s[^>]*)?>([\s\S]*?)<\/t[dh]>/gi)]
          .map((cell) => stripTags(cell[2] ?? ""))
          .filter((cell) => cell !== "");
        if (cells.length > 0) {
          blocks.push({ text: cells.join(" | "), pageNumber: 1, kind: "paragraph" });
        }
      }
      continue;
    }
    if (tag === "li") {
      const text = stripTags(inner);
      if (text !== "") {
        blocks.push({ text: `• ${text}`, pageNumber: 1, kind: "paragraph" });
      }
      continue;
    }
    const text = stripTags(inner);
    if (text === "") {
      continue;
    }
    blocks.push({
      text,
      pageNumber: 1,
      kind: tag.startsWith("h") ? "heading" : "paragraph",
    });
  }
  return blocks;
}

export async function parseDocxBuffer(bytes: Uint8Array): Promise<ParsedDocument> {
  let html: string;
  const warnings: string[] = [];
  try {
    const result = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
    html = result.value;
    for (const message of result.messages) {
      if (message.message !== "") {
        warnings.push(`Unmapped Word content skipped: ${message.message.slice(0, 120)}`);
      }
    }
  } catch {
    throw new ParseError(
      "corrupt",
      "This Word file couldn't be read. It may be damaged or in an unsupported format.",
    );
  }

  const blocks = htmlToBlocks(html);
  if (blocks.length === 0) {
    throw new ParseError("empty", "No readable text was found in this Word file.");
  }
  const sections = detectSections(blocks).map((section) => ({
    title: section.title,
    paragraphs: [...section.paragraphs],
    pageNumber: 1,
  }));
  if (sections.length === 0) {
    throw new ParseError("empty", "No readable sections were found in this Word file.");
  }
  return { sections, pageCount: 1, warnings: warnings.slice(0, 5) };
}

export const docxParser: DocumentParser = {
  kind: "docx",
  parse: parseDocxBuffer,
};
