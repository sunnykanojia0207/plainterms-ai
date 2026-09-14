"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ACCEPTED_MIME_TYPES } from "@/lib/security/validate";
import { cn } from "@/lib/utils/cn";

interface UploadZoneProps {
  readonly onFilesSelected: (files: readonly File[]) => void;
  readonly compact?: boolean;
}

const ACCEPT_ATTR =
  ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Presentational upload dropzone: drag-and-drop + browse, visual drag state,
 * keyboard operable. File intake logic arrives with the ingestion milestone;
 * this component only reports selected files upward.
 */
export function UploadZone({ onFilesSelected, compact = false }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }

  return (
    <div
      aria-label="Upload a document. Accepts PDF, DOCX, and TXT."
      aria-describedby="upload-hint"
      role="group"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-colors",
        compact ? "px-4 py-6" : "px-6 py-10",
        dragging ? "border-accent bg-accent-muted ring-2 ring-accent" : "border-border bg-surface",
      )}
    >
      <p className="text-base font-medium" aria-live="polite">
        {dragging ? "Drop to review" : "Drag a contract here"}
      </p>
      <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
        Browse files
      </Button>
      <p id="upload-hint" className="text-sm text-secondary">
        PDF, DOCX, or TXT · up to 25 MB
      </p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-secondary">
        <LockGlyph />
        Private to you · Used only for your review · Delete anytime
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple={false}
        aria-label="Choose a document file"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) {
            onFilesSelected(files);
          }
          event.target.value = "";
        }}
      />
      <span className="sr-only">Accepted types: {ACCEPTED_MIME_TYPES.join(", ")}</span>
    </div>
  );
}

function LockGlyph() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
      <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" />
    </svg>
  );
}
