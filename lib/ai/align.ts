/**
 * Deterministic section alignment — runs BEFORE any model call.
 * Sections align by stable id; identical normalized text is marked same
 * (and never sent to Gemini); everything else becomes a candidate pair
 * with a similarity score. Gemini judges meaning, never byte diffs.
 */
import type { ContentSection } from "@/lib/ai/content";

export type PairStatus = "same" | "candidate" | "added" | "removed";

export interface AlignedPair {
  readonly sectionId: string;
  readonly title: string;
  readonly left: ContentSection | null;
  readonly right: ContentSection | null;
  readonly status: PairStatus;
  /** Token overlap 0–1. Context for the model, never a verdict. */
  readonly similarity: number;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function tokenSet(text: string): Set<string> {
  return new Set(
    normalize(text)
      .split(" ")
      .filter((token) => token !== ""),
  );
}

/** Jaccard similarity over normalized tokens. */
export function textSimilarity(left: string, right: string): number {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);
  if (leftTokens.size === 0 && rightTokens.size === 0) {
    return 1;
  }
  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }
  const union = leftTokens.size + rightTokens.size - overlap;
  return union === 0 ? 1 : overlap / union;
}

export function alignContents(
  left: readonly ContentSection[],
  right: readonly ContentSection[],
): readonly AlignedPair[] {
  const rightById = new Map(right.map((section) => [section.id, section]));
  const pairs: AlignedPair[] = [];
  const matchedRight = new Set<string>();

  for (const leftSection of left) {
    const rightSection = rightById.get(leftSection.id);
    if (rightSection === undefined) {
      pairs.push({
        sectionId: leftSection.id,
        title: leftSection.title,
        left: leftSection,
        right: null,
        status: "removed",
        similarity: 0,
      });
      continue;
    }
    matchedRight.add(rightSection.id);
    const same = normalize(leftSection.text) === normalize(rightSection.text);
    pairs.push({
      sectionId: leftSection.id,
      title: leftSection.title,
      left: leftSection,
      right: rightSection,
      status: same ? "same" : "candidate",
      similarity: same ? 1 : textSimilarity(leftSection.text, rightSection.text),
    });
  }

  for (const rightSection of right) {
    if (!matchedRight.has(rightSection.id)) {
      pairs.push({
        sectionId: rightSection.id,
        title: rightSection.title,
        left: null,
        right: rightSection,
        status: "added",
        similarity: 0,
      });
    }
  }

  return pairs;
}

/** Non-identical pairs: the only input the model ever sees. */
export function candidatePairs(pairs: readonly AlignedPair[]): readonly AlignedPair[] {
  return pairs.filter((pair) => pair.status !== "same");
}
