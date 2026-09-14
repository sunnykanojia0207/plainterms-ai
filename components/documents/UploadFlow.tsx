"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { UploadZone } from "@/components/ui/UploadZone";
import {
  isUploadFailure,
  uploadDocument,
  type UploadedRecord,
} from "@/lib/documents/upload-client";
import { validateUpload } from "@/lib/security/validate";

export interface UploadSelection {
  readonly fileName: string;
  readonly title: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
}

interface UploadFlowProps {
  readonly onUploaded: (record: UploadedRecord) => void;
  readonly compact?: boolean;
}

type FlowState =
  | { readonly kind: "idle" }
  | { readonly kind: "selected"; readonly file: File; readonly selection: UploadSelection }
  | { readonly kind: "uploading"; readonly file: File; readonly selection: UploadSelection }
  | { readonly kind: "invalid"; readonly issues: readonly string[] }
  | { readonly kind: "failed"; readonly message: string };

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function titleFromFileName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  const words = base.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1) || "Untitled document";
}

/**
 * Upload interaction: idle → selected (details + remove + continue) →
 * uploading (progress + cancel) → done (via onUploaded) or failed/invalid
 * with named recovery. Client-side checks run first; the server validates
 * authoritatively. File bytes travel only to the upload endpoint.
 */
export function UploadFlow({ onUploaded, compact = false }: UploadFlowProps) {
  const [state, setState] = useState<FlowState>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  function handleFilesSelected(files: readonly File[]): void {
    const file = files[0];
    if (file === undefined) {
      return;
    }
    const issues = validateUpload({
      fileName: file.name,
      mimeType: file.type || guessMime(file.name),
      sizeBytes: file.size,
    });
    if (issues.length > 0) {
      setState({
        kind: "invalid",
        issues: issues.map((issue) => issue.detail),
      });
      return;
    }
    setState({
      kind: "selected",
      file,
      selection: {
        fileName: file.name,
        title: titleFromFileName(file.name),
        mimeType: file.type || guessMime(file.name),
        sizeBytes: file.size,
      },
    });
  }

  async function handleContinue(file: File): Promise<void> {
    const controller = new AbortController();
    abortRef.current = controller;
    setState((current) =>
      current.kind === "selected"
        ? { kind: "uploading", file, selection: current.selection }
        : current,
    );
    try {
      const record = await uploadDocument(file, controller.signal);
      onUploaded(record);
      setState({ kind: "idle" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setState({
        kind: "failed",
        message: isUploadFailure(error) ? error.message : "Something went wrong. Try again.",
      });
    }
  }

  function cancelUpload(): void {
    abortRef.current?.abort();
    setState((current) =>
      current.kind === "uploading"
        ? {
            kind: "selected",
            file: current.file,
            selection: current.selection,
          }
        : current,
    );
  }

  if (state.kind === "selected" || state.kind === "uploading") {
    const { selection } = state;
    const uploading = state.kind === "uploading";
    return (
      <div
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:p-6"
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-base font-semibold">{selection.title}</p>
            <p className="text-sm text-text-secondary">
              {selection.fileName} · {formatSize(selection.sizeBytes)}
            </p>
          </div>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setState({ kind: "idle" })}
            disabled={uploading}
          >
            Remove
          </Button>
        </div>
        <p aria-live="polite" className="text-sm text-text-secondary">
          {uploading ? "Uploading and preparing your document…" : "Ready when you are."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void handleContinue(state.file)}
            disabled={uploading}
            loading={uploading}
          >
            Review document
          </Button>
          {uploading ? (
            <Button variant="secondary" onClick={cancelUpload}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <UploadZone onFilesSelected={handleFilesSelected} compact={compact} />
      {state.kind === "invalid" ? (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-critical/40 bg-critical-bg px-4 py-3"
        >
          <p className="text-sm font-semibold text-critical">That file can&apos;t be reviewed</p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {state.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
          <p className="text-sm text-text-secondary">
            Choose a PDF, DOCX, or TXT file up to 25 MB, then try again.
          </p>
        </div>
      ) : null}
      {state.kind === "failed" ? (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-critical/40 bg-critical-bg px-4 py-3"
        >
          <p className="text-sm font-semibold text-critical">The upload didn&apos;t complete</p>
          <p className="text-sm">{state.message}</p>
          <div>
            <Button variant="secondary" size="sm" onClick={() => setState({ kind: "idle" })}>
              Choose a different file
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Fallback when the browser reports an empty MIME type for known extensions. */
function guessMime(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".txt")) {
    return "text/plain";
  }
  return "";
}
