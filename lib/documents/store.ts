"use client";

/**
 * Document store — metadata only. File contents are NEVER stored, logged,
 * or transmitted: uploads register a title + type + fixture reference and
 * the bytes are discarded. Persistence is sessionStorage (this tab only);
 * useSyncExternalStore keeps server and client snapshots consistent.
 */
import { useSyncExternalStore } from "react";
import type { Document, DocumentId, DocumentStatus } from "@/lib/domain/types";
import { FIXTURE_ID, FIXTURE_PAGE_COUNT, FIXTURE_PARTIES } from "@/lib/documents/fixture";
import type { FixtureSection } from "@/lib/documents/fixture";
import { FIXTURE_V1_ID } from "@/lib/documents/fixture-v1";

export interface StoredDocument extends Document {
  /**
   * Deterministic fixture backing this record. Uploads resolve to the
   * current (V2) fixture; the V1 sample backs comparison demos.
   */
  readonly fixtureId: string;
  /**
   * Normalized sections for real uploads. Null means fixture-backed
   * (resolved via getSectionsForFixture). Embedded for uploads so the
   * viewer works without re-fetching sensitive content.
   */
  readonly sections: readonly FixtureSection[] | null;
  /** Original filename, for display only. */
  readonly fileName: string;
  /** True for the built-in samples; user uploads are false. */
  readonly isSample: boolean;
}

type Listener = () => void;

const STORAGE_KEY = "plainterms-documents-v1";
const SAMPLE_ID = "sample-service-agreement";
const SAMPLE_V1_ID = "sample-service-agreement-v1";

let cache: readonly StoredDocument[] | null = null;
const listeners = new Set<Listener>();

function buildSample(
  id: string,
  title: string,
  fixtureId: string,
  fileName: string,
): StoredDocument {
  const now = new Date().toISOString();
  return {
    id,
    title,
    type: "service-agreement",
    status: "ready",
    pageCount: FIXTURE_PAGE_COUNT,
    parties: FIXTURE_PARTIES,
    currentVersion: 1,
    createdAt: now,
    updatedAt: now,
    fixtureId,
    fileName,
    isSample: true,
    sections: null,
  };
}

/** Built-in samples: V1 (earlier terms) and V2 (current terms) for demos. */
function seedSamples(): readonly StoredDocument[] {
  return [
    buildSample(
      SAMPLE_V1_ID,
      "Sample — Client Services Agreement v1",
      FIXTURE_V1_ID,
      "sample-services-agreement-v1.pdf",
    ),
    buildSample(
      SAMPLE_ID,
      "Sample — Client Services Agreement v2",
      FIXTURE_ID,
      "sample-services-agreement-v2.pdf",
    ),
  ];
}

function readStorage(): readonly StoredDocument[] | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed as readonly StoredDocument[];
  } catch {
    return null;
  }
}

function writeStorage(documents: readonly StoredDocument[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch {
    // Storage full or unavailable — the in-memory cache still works.
  }
}

function getSnapshot(): readonly StoredDocument[] {
  if (cache !== null) {
    return cache;
  }
  cache = readStorage() ?? seedSamples();
  return cache;
}

let serverSnapshot: readonly StoredDocument[] | null = null;

function getServerSnapshot(): readonly StoredDocument[] {
  if (serverSnapshot === null) {
    serverSnapshot = seedSamples();
  }
  return serverSnapshot;
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function setDocuments(documents: readonly StoredDocument[]): void {
  cache = documents;
  writeStorage(documents);
  emit();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `doc-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export interface NewUpload {
  readonly fileName: string;
  readonly title: string;
}

/** Registers an upload as a processing document. Contents are not retained. */
export function addUpload(upload: NewUpload): StoredDocument {
  const now = new Date().toISOString();
  const document: StoredDocument = {
    id: createId(),
    title: upload.title,
    type: "service-agreement",
    status: "processing",
    pageCount: FIXTURE_PAGE_COUNT,
    parties: FIXTURE_PARTIES,
    currentVersion: 1,
    createdAt: now,
    updatedAt: now,
    fixtureId: FIXTURE_ID,
    fileName: upload.fileName,
    isSample: false,
    sections: null,
  };
  setDocuments([...getSnapshot(), document]);
  return document;
}

export interface UploadRecordInput {
  readonly id: string;
  readonly title: string;
  readonly type: StoredDocument["type"];
  readonly pageCount: number;
  readonly fileName: string;
  readonly sizeBytes: number;
  readonly sections: readonly FixtureSection[];
  readonly typeConfident: boolean;
}

/** Registers a server-parsed upload. Contents stay out of logs by design. */
export function addUploadRecord(input: UploadRecordInput): StoredDocument {
  const now = new Date().toISOString();
  const document: StoredDocument = {
    id: input.id,
    title: input.title,
    type: input.type,
    status: "ready",
    pageCount: input.pageCount,
    parties: [],
    currentVersion: 1,
    createdAt: now,
    updatedAt: now,
    fixtureId: "upload",
    fileName: input.fileName,
    isSample: false,
    sections: [...input.sections],
  };
  setDocuments([...getSnapshot(), document]);
  return document;
}

export function setDocumentStatus(id: DocumentId, status: DocumentStatus): void {
  setDocuments(
    getSnapshot().map((document) =>
      document.id === id ? { ...document, status, updatedAt: new Date().toISOString() } : document,
    ),
  );
}

export function removeDocument(id: DocumentId): void {
  const target = getSnapshot().find((document) => document.id === id);
  setDocuments(getSnapshot().filter((document) => document.id !== id));
  // Best-effort server cleanup for real uploads (samples are fixture-only).
  // Fire-and-forget: local state is authoritative for the UI.
  if (target !== undefined && !target.isSample) {
    void fetch(`/api/documents/${id}`, { method: "DELETE" }).catch(() => {});
  }
}

/**
 * Deletes all user-uploaded documents (samples stay). Returns the count
 * removed. Powers Settings → Delete my documents.
 */
export function clearUserDocuments(): number {
  const documents = getSnapshot();
  const survivors = documents.filter((document) => document.isSample);
  const removed = documents.length - survivors.length;
  setDocuments(survivors);
  for (const document of documents) {
    if (!document.isSample) {
      void fetch(`/api/documents/${document.id}`, { method: "DELETE" }).catch(() => {});
    }
  }
  return removed;
}

export function getDocumentById(id: DocumentId): StoredDocument | null {
  return getSnapshot().find((document) => document.id === id) ?? null;
}

/** Reseeds the built-in sample. Used by tests and the "restore sample" action. */
export function resetStoreForTests(documents: readonly StoredDocument[]): void {
  cache = documents;
  writeStorage(documents);
  emit();
}

export function useDocuments(): readonly StoredDocument[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useDocument(id: DocumentId): StoredDocument | null {
  const documents = useDocuments();
  return documents.find((document) => document.id === id) ?? null;
}
