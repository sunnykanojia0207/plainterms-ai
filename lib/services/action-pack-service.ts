/**
 * ActionPackService boundary — preparation pack generation from validated
 * analysis, plus export rendering. Implemented by
 * lib/ai/action-pack-service.ts (server-only, Gemini-backed).
 */
import type { ActionPack, DocumentId } from "@/lib/domain/types";

export type ActionPackExportFormat = "pdf" | "markdown";

export interface ActionPackService {
  getActionPack(documentId: DocumentId): Promise<ActionPack>;
  renderExport(pack: ActionPack, format: ActionPackExportFormat): Promise<string>;
}
