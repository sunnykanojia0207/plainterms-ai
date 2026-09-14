/**
 * Retrieval-first context selection. Deterministic keyword scoring picks
 * the most relevant sections BEFORE any model call, so prompts stay small
 * and grounded. A user-selected section is always included. Pure logic.
 */
import type { ContentSection } from "@/lib/ai/content";

const STOPWORDS = new Set(
  "what,when,where,which,who,does,do,is,are,was,were,can,the,a,an,and,or,of,to,in,on,for,my,this,that,it,its,by,with,about,how,there,their,agreement,contract,document,clause,mean,doesnt,don't".split(
    ",",
  ),
);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

export interface RankedSection {
  readonly section: ContentSection;
  readonly score: number;
}

/** Scores sections against the question by token overlap. */
export function rankSections(
  question: string,
  sections: readonly ContentSection[],
): readonly RankedSection[] {
  const questionTokens = new Set(tokens(question));
  const ranked = sections.map((section) => {
    const sectionTokens = new Set(tokens(`${section.title} ${section.text}`));
    let overlap = 0;
    for (const token of questionTokens) {
      if (sectionTokens.has(token)) {
        overlap += 1;
      }
    }
    return { section, score: overlap };
  });
  return [...ranked].sort((a, b) => b.score - a.score);
}

export interface SelectionOptions {
  /** Section the user explicitly selected (always first). */
  readonly selectedSectionId?: string | null;
  readonly maxSections?: number;
  readonly maxChars?: number;
}

export interface SelectedContext {
  readonly sections: readonly ContentSection[];
  readonly truncated: boolean;
  readonly totalSections: number;
}

const DEFAULT_MAX_SECTIONS = 4;
const DEFAULT_MAX_CHARS = 12000;

/**
 * Selects retrieved sections plus the user's selected section first.
 * Caps sections and characters so prompts stay bounded.
 */
export function selectContext(
  question: string,
  sections: readonly ContentSection[],
  options: SelectionOptions = {},
): SelectedContext {
  const maxSections = options.maxSections ?? DEFAULT_MAX_SECTIONS;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const ranked = rankSections(question, sections);

  const chosen: ContentSection[] = [];
  const seen = new Set<string>();
  const selected = options.selectedSectionId ?? null;
  if (selected !== null) {
    const match = sections.find((section) => section.id === selected);
    if (match !== undefined) {
      chosen.push(match);
      seen.add(match.id);
    }
  }
  for (const { section, score } of ranked) {
    if (chosen.length >= maxSections) {
      break;
    }
    if (seen.has(section.id)) {
      continue;
    }
    // Keep zero-overlap sections only to fill a short list.
    if (score === 0 && chosen.length >= 2) {
      break;
    }
    chosen.push(section);
    seen.add(section.id);
  }

  let chars = 0;
  const bounded: ContentSection[] = [];
  for (const section of chosen) {
    if (chars + section.text.length > maxChars && bounded.length > 0) {
      break;
    }
    bounded.push(section);
    chars += section.text.length;
  }

  return {
    sections: bounded,
    truncated: bounded.length < chosen.length,
    totalSections: sections.length,
  };
}

/** Normalized question form for cache keys. */
export function normalizeQuestion(question: string): string {
  return question.replace(/\s+/g, " ").trim().replace(/\?+$/, "").toLowerCase();
}

export interface HistoryTurn {
  readonly question: string;
  readonly answerSummary: string;
}

const MAX_HISTORY_TURNS = 3;
const ANSWER_SUMMARY_CHARS = 300;

/** Keeps the last turns with trimmed answer summaries to bound growth. */
export function pruneHistory(turns: readonly HistoryTurn[]): readonly HistoryTurn[] {
  return turns.slice(-MAX_HISTORY_TURNS).map((turn) => ({
    question: turn.question.slice(0, 200),
    answerSummary: turn.answerSummary.slice(0, ANSWER_SUMMARY_CHARS),
  }));
}
