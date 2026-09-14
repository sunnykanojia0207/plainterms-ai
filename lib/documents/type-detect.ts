/**
 * Document-type detection by keyword scoring. Best-effort: returns the
 * winning type plus a confidence flag. Low-confidence results must be
 * shown with the "couldn't confidently identify" notice — never forced.
 */
import "server-only";

export type DetectedDocumentType = "service-agreement" | "nda" | "statement-of-work";

export interface TypeDetection {
  readonly type: DetectedDocumentType;
  readonly confident: boolean;
}

const KEYWORDS: Record<DetectedDocumentType, readonly string[]> = {
  "service-agreement": [
    "contractor",
    "services",
    "deliverables",
    "invoice",
    "consulting",
    "freelanc",
    "statement of work",
  ],
  nda: [
    "non-disclosure",
    "nondisclosure",
    "confidential information",
    "disclosing party",
    "receiving party",
  ],
  "statement-of-work": [
    "milestone",
    "acceptance criteria",
    "project timeline",
    "deliverable schedule",
    "work order",
  ],
};

/** Minimum winning score and margin for a confident classification. */
const MIN_SCORE = 3;
const MIN_MARGIN = 2;

function score(text: string, keywords: readonly string[]): number {
  let total = 0;
  for (const keyword of keywords) {
    let count = 0;
    let from = 0;
    while (total < 25) {
      const found = text.indexOf(keyword, from);
      if (found === -1) {
        break;
      }
      count += 1;
      from = found + keyword.length;
    }
    total += Math.min(count, 5);
  }
  return total;
}

export function detectDocumentType(fullText: string): TypeDetection {
  const text = fullText.toLowerCase();
  const scored = (Object.keys(KEYWORDS) as readonly DetectedDocumentType[]).map((type) => ({
    type,
    score: score(text, KEYWORDS[type]),
  }));
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const runnerUp = scored[1];
  if (best === undefined) {
    return { type: "service-agreement", confident: false };
  }
  const confident =
    best.score >= MIN_SCORE &&
    (runnerUp === undefined || best.score - runnerUp.score >= MIN_MARGIN);
  return { type: best.type, confident };
}
