"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { useToast } from "@/components/ui/Toast";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/vocabulary";
import { removeDocument, useDocuments, type StoredDocument } from "@/lib/documents/store";

function statusTone(
  status: StoredDocument["status"],
): "accent" | "neutral" | "success" | "warning" | "critical" {
  switch (status) {
    case "ready":
      return "success";
    case "processing":
    case "reviewing":
    case "comparison-ready":
      return "accent";
    case "needs-attention":
      return "warning";
    case "failed":
      return "critical";
    default:
      return "neutral";
  }
}

function statusLabel(status: StoredDocument["status"]): string {
  switch (status) {
    case "uploaded":
      return "Uploaded";
    case "processing":
      return "Preparing";
    case "ready":
      return "Ready";
    case "reviewing":
      return "In review";
    case "comparison-ready":
      return "Compared";
    case "needs-attention":
      return "Needs attention";
    case "failed":
      return "Failed";
    case "deleted":
      return "Deleted";
  }
}

function openTarget(document: StoredDocument): string {
  return document.status === "ready" ? `/review/${document.id}` : `/ready/${document.id}`;
}

export function DocumentRow({ document }: { readonly document: StoredDocument }) {
  const { notify } = useToast();
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-base font-semibold">{document.title}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{DOCUMENT_TYPE_LABELS[document.type]}</Badge>
          <Badge tone={statusTone(document.status)}>{statusLabel(document.status)}</Badge>
          {document.isSample ? <Badge tone="neutral">Sample</Badge> : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" size="sm" href={openTarget(document)}>
          Open
        </Button>
        <Button variant="secondary" size="sm" href="/compare">
          Compare
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => {
            removeDocument(document.id);
            notify(`“${document.title}” was deleted.`);
          }}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}

/** Library driven by the document store. Groups filter by real status. */
export function DocumentsLibrary() {
  const documents = useDocuments();
  const ordered = [...documents].reverse();

  const list = (items: readonly StoredDocument[], empty: string) =>
    items.length === 0 ? (
      <EmptyState title="Nothing here yet" description={empty} />
    ) : (
      <ul className="flex flex-col gap-3">
        {items.map((document) => (
          <DocumentRow key={document.id} document={document} />
        ))}
      </ul>
    );

  return (
    <Tabs
      label="Document groups"
      items={[
        {
          id: "recent",
          label: "Recent",
          content: list(
            ordered,
            "Upload a client contract to start your library. Service Agreements, NDAs, and Statements of Work are supported.",
          ),
        },
        {
          id: "in-review",
          label: "In Review",
          content: list(
            ordered.filter(
              (document) => document.status === "reviewing" || document.status === "processing",
            ),
            "Documents being prepared or reviewed will appear here.",
          ),
        },
        {
          id: "compared",
          label: "Compared",
          content: list(
            ordered.filter((document) => document.status === "comparison-ready"),
            "When you compare two versions of a contract, the pair will be listed here.",
          ),
        },
        {
          id: "archived",
          label: "Archived",
          content: (
            <EmptyState
              title="Nothing archived"
              description="Archiving arrives with portfolio features. For now, delete documents you no longer need."
            />
          ),
        },
      ]}
    />
  );
}

export function LibraryHint() {
  return (
    <Text tone="secondary" className="text-sm">
      Documents stay in this browser tab only, and file contents are never stored.
    </Text>
  );
}
