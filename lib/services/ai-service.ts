/**
 * AIService boundary — all Gemini-backed capabilities behind one contract.
 * Every method consumes and returns domain types only; prompts, model
 * selection, and provider SDKs stay behind this interface.
 * Implemented in a later milestone (no business behavior here).
 */
import type {
  ActionPack,
  AIResponse,
  Clause,
  Comparison,
  Document,
  DocumentId,
} from "@/lib/domain/types";

export interface DocumentSummary {
  readonly documentId: DocumentId;
  readonly summary: string;
  readonly keyFacts: readonly string[];
}

export interface AIService {
  summarizeDocument(document: Document): Promise<DocumentSummary>;
  extractClauses(documentId: DocumentId): Promise<readonly Clause[]>;
  answerQuestion(documentIds: readonly DocumentId[], question: string): Promise<AIResponse>;
  compareDocuments(leftDocumentId: DocumentId, rightDocumentId: DocumentId): Promise<Comparison>;
  generateActionPack(documentId: DocumentId): Promise<ActionPack>;
}
