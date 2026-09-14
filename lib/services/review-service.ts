/**
 * ReviewService boundary — document understanding and clause intelligence
 * reads (summary header, findings, obligations snapshot, key dates).
 * Implemented in a later milestone (no business behavior here).
 */
import type {
  Clause,
  DocumentId,
  KeyDate,
  ObligationItem,
  ReviewFinding,
} from "@/lib/domain/types";
import type { DocumentSummary } from "@/lib/services/ai-service";

export interface ReviewService {
  getSummary(documentId: DocumentId): Promise<DocumentSummary>;
  getFindings(documentId: DocumentId): Promise<readonly ReviewFinding[]>;
  getClauses(documentId: DocumentId): Promise<readonly Clause[]>;
  getObligations(documentId: DocumentId): Promise<readonly ObligationItem[]>;
  getKeyDates(documentId: DocumentId): Promise<readonly KeyDate[]>;
}
