/**
 * Parsed-document records: normalized upload results held server-side with
 * a TTL and FIFO cap. Temporary by design — entries expire, and clients
 * can delete explicitly. Only normalized text is kept (never raw files,
 * which are deleted immediately after parsing).
 */
import "server-only";
import { DOCUMENT_LIMITS } from "@/lib/documents/limits";
import type { FixtureSection } from "@/lib/documents/fixture";

export interface ParsedRecord {
  readonly id: string;
  readonly title: string;
  readonly type: "service-agreement" | "nda" | "statement-of-work";
  readonly typeConfident: boolean;
  readonly pageCount: number;
  readonly sections: readonly FixtureSection[];
  readonly warnings: readonly string[];
  readonly createdAt: number;
  readonly expiresAt: number;
}

const records = new Map<string, ParsedRecord>();

function sweepExpired(now: number): void {
  for (const [id, record] of records) {
    if (record.expiresAt <= now) {
      records.delete(id);
    }
  }
  while (records.size > DOCUMENT_LIMITS.maxRecords) {
    const oldest = records.keys().next();
    if (oldest.done === true) {
      break;
    }
    records.delete(oldest.value);
  }
}

export function saveRecord(record: ParsedRecord): void {
  sweepExpired(Date.now());
  records.set(record.id, record);
}

export function getRecord(id: string): ParsedRecord | null {
  const record = records.get(id);
  if (record === undefined) {
    return null;
  }
  if (record.expiresAt <= Date.now()) {
    records.delete(id);
    return null;
  }
  return record;
}

export function deleteRecord(id: string): void {
  records.delete(id);
}

/** Test seam: clears all records. */
export function clearRecords(): void {
  records.clear();
}
