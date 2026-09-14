/**
 * Document-content resolver — the single seam between storage and AI.
 * Fixture-backed documents resolve from fixtures; real uploads resolve
 * from parsed server records. Prompts and services never know which.
 */
import "server-only";
import { contentFromFixture, type DocumentContent } from "@/lib/ai/content";
import { getRecord } from "@/lib/documents/records";

export interface ContentDescriptor {
  readonly documentId: string;
  readonly title: string;
  readonly fixtureId: string;
  readonly version?: number;
}

export class UnknownDocumentError extends Error {
  constructor(documentId: string) {
    super(`Unknown document: ${documentId}.`);
    this.name = "UnknownDocumentError";
  }
}

export function resolveDocumentContent(descriptor: ContentDescriptor): DocumentContent {
  const record = getRecord(descriptor.documentId);
  if (record !== null) {
    return {
      documentId: record.id,
      title: record.title,
      documentType: record.type,
      sections: record.sections.map((section) => ({
        id: section.id,
        title: section.title,
        pageNumber: section.pageNumber,
        text: section.paragraphs.join("\n"),
      })),
    };
  }
  try {
    return contentFromFixture(descriptor.documentId, descriptor.title, descriptor.fixtureId);
  } catch {
    throw new UnknownDocumentError(descriptor.documentId);
  }
}
