/**
 * ComparisonService boundary — deterministic alignment plus semantic
 * change classification. The Gemini judging step is invoked through
 * AIService; this contract owns alignment, materiality bookkeeping,
 * and verdict assembly. Implemented in a later milestone.
 */
import type { Comparison, DocumentId } from "@/lib/domain/types";

export interface ComparisonService {
  compareVersions(leftDocumentId: DocumentId, rightDocumentId: DocumentId): Promise<Comparison>;
}
