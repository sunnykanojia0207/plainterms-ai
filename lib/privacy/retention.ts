/**
 * Retention model — the user's choice about document lifetime.
 * Session-only leaves no stored copy; saved documents are deletable
 * at any time. Enforcement lives in the future document store behind
 * this contract.
 */

/** Plain-words retention choice, set at upload. */
export type RetentionChoice = "session-only" | "saved";

export const RETENTION_COPY: Record<RetentionChoice, string> = {
  "session-only": "Session only — deleted when you leave.",
  saved: "Keep for my review — delete anytime.",
} as const;

export interface RetentionPolicy {
  readonly choice: RetentionChoice;
  /** ISO timestamp after which a stored copy must be purged, if any. */
  readonly purgeAfter: string | null;
}

export function defaultRetention(): RetentionPolicy {
  return { choice: "session-only", purgeAfter: null };
}
