/**
 * Server Action Pack service — implements the ActionPackService boundary.
 * Maps validated AI items onto domain objects and renders export-ready
 * Markdown from the same validated bundle (single renderer, no duplication).
 */
import "server-only";
import { buildActionPack } from "@/lib/ai/action-pack";
import type { ActionPackService, ActionPackExportFormat } from "@/lib/services/action-pack-service";
import type { ActionPack, ActionPackItem, DocumentId, EvidenceReference } from "@/lib/domain/types";
import type { ActionPackDescriptor } from "@/lib/ai/action-pack";
import type { ActionPackEvidenceAI } from "@/lib/ai/action-pack-schemas";

function toEvidence(
  evidence: ActionPackEvidenceAI,
  documentId: DocumentId,
  index: number,
): EvidenceReference {
  return {
    clauseId: `${documentId}:${evidence.sectionId}:${index}`,
    documentId,
    sectionId: evidence.sectionId,
    location: `${evidence.sectionTitle} · p. ${evidence.pageNumber}`,
    quote: evidence.quote,
    pageNumber: evidence.pageNumber,
  };
}

export class PlainTermsActionPackService implements ActionPackService {
  constructor(
    private readonly resolve: (documentId: DocumentId) => Promise<ActionPackDescriptor>,
  ) {}

  async getActionPack(documentId: DocumentId): Promise<ActionPack> {
    const descriptor = await this.resolve(documentId);
    const bundle = await buildActionPack(descriptor);
    const items: ActionPackItem[] = bundle.items.map((item, index) => ({
      id: `${documentId}:pack-${index}`,
      kind: item.kind,
      title: item.title,
      summary: item.summary,
      priority: item.priority,
      evidence: item.evidence === null ? null : toEvidence(item.evidence, documentId, index),
      uncertainty: item.uncertainty,
      nextStep: item.nextStep,
    }));
    return { documentId, items };
  }

  async renderExport(pack: ActionPack, format: ActionPackExportFormat): Promise<string> {
    if (format !== "markdown") {
      throw new Error(`Unsupported export format: ${format}.`);
    }
    const byKind = (kind: ActionPackItem["kind"]) =>
      pack.items.filter((item) => item.kind === kind);
    const section = (heading: string, items: readonly ActionPackItem[]) => {
      if (items.length === 0) {
        return "";
      }
      const lines = items.map((item) => {
        const evidence =
          item.evidence === null
            ? "_No source excerpt — confirm independently._"
            : `> ${item.evidence.quote}\n> — ${item.evidence.location}`;
        const uncertainty = item.uncertainty === null ? "" : `\nUncertainty: ${item.uncertainty}`;
        const nextStep = item.nextStep === null ? "" : `\nNext step: ${item.nextStep}`;
        return `### ${item.title} (${item.priority})\n\n${item.summary}\n\n${evidence}${uncertainty}${nextStep}`;
      });
      return `## ${heading}\n\n${lines.join("\n\n")}\n\n`;
    };
    return (
      `# Action Pack — ${pack.documentId}\n\n` +
      `_Prepared from the document. General information, not legal advice._\n\n` +
      section("Key obligations", byKind("obligation")) +
      section("Important dates", byKind("date")) +
      section("Items worth reviewing", byKind("review")) +
      section("Questions to clarify", byKind("clarify")) +
      section("Questions for a legal professional", byKind("lawyer")) +
      section(
        "Before-signing checklist",
        byKind("checklist").map((item) => ({
          ...item,
          summary: `- [ ] ${item.summary}`,
        })),
      ) +
      section("Information still needed", byKind("info-needed"))
    );
  }
}
