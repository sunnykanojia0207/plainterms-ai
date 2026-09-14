/**
 * DocumentService boundary — upload intake, library, retention, deletion.
 * Interface only. The UI must depend on this contract, never on a provider.
 * Implemented in a later milestone (no business behavior here).
 */
import type { Document, DocumentId, DocumentStatus } from "@/lib/domain/types";

export interface DocumentListFilter {
  readonly status?: DocumentStatus;
  readonly query?: string;
}

export interface DocumentService {
  listDocuments(filter?: DocumentListFilter): Promise<readonly Document[]>;
  getDocument(id: DocumentId): Promise<Document | null>;
  deleteDocument(id: DocumentId): Promise<void>;
}
