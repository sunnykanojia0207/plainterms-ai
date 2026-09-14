"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { FIXTURE_EFFECTIVE_DATE } from "@/lib/documents/fixture";
import { DOCUMENT_TYPE_LABELS } from "@/lib/domain/vocabulary";
import { getSectionsForFixture } from "@/lib/documents/sections";
import { useDocument } from "@/lib/documents/store";

interface ReadyViewProps {
  readonly documentId: string;
}

/**
 * Document Ready checkpoint: confirms what was understood (title, type,
 * pages, parties, dates), shows a labeled demo preview, and routes onward.
 * No legal interpretation happens here.
 */
export function ReadyView({ documentId }: ReadyViewProps) {
  const document = useDocument(documentId);

  if (document === null) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <ErrorState
          kind="not-found"
          detail="This document doesn't exist or was deleted. Upload it again to review it."
          action={
            <Button size="sm" href="/">
              Upload a document
            </Button>
          }
        />
      </div>
    );
  }

  if (document.status !== "ready") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 py-10">
        <Heading level={1}>Still getting ready</Heading>
        <Text tone="secondary">“{document.title}” hasn&apos;t finished preparation yet.</Text>
        <div>
          <Button href={`/processing/${document.id}`}>Continue preparation</Button>
        </div>
      </div>
    );
  }

  const sections = document.sections ?? getSectionsForFixture(document.fixtureId, document.id);
  const first = sections[0];
  const payment = sections.find((section) => section.id === "sec-payment");
  // Prefer the classic key sections when present (fixtures); otherwise the
  // first sections of the uploaded document.
  const keySections = sections.filter((section) =>
    ["sec-payment", "sec-ip", "sec-termination", "sec-restrictions"].includes(section.id),
  );
  const highlighted = (keySections.length > 0 ? keySections : sections.slice(0, 4)).slice(0, 4);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{DOCUMENT_TYPE_LABELS[document.type]}</Badge>
          <Badge tone="neutral">
            {document.pageCount} {document.pageCount === 1 ? "page" : "pages"}
          </Badge>
          <Badge tone="success">Ready</Badge>
        </div>
        <Heading level={1}>{document.title}</Heading>
        {document.parties.length > 0 ? (
          <Text tone="secondary">
            Between {document.parties.map((party) => party.name).join(" and ")} · Effective{" "}
            {FIXTURE_EFFECTIVE_DATE}
          </Text>
        ) : (
          <Text tone="secondary">
            Uploaded document · {sections.length} {sections.length === 1 ? "section" : "sections"}
            {document.isSample ? "" : " · Review the extracted text below"}
          </Text>
        )}
      </div>

      <Card>
        <h2 className="text-sm font-semibold tracking-wide text-secondary uppercase">Preview</h2>
        <Text className="mt-2">{first?.paragraphs[0] ?? ""}</Text>
        <Text className="mt-2" tone="secondary">
          {payment?.paragraphs[0] ?? ""}
        </Text>
        <p className="mt-3 text-xs text-secondary">
          {document.isSample
            ? "Demo preview from sample content — legal interpretation arrives with the analysis milestone."
            : "Preview of your uploaded document — legal interpretation arrives with the analysis milestone."}
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold tracking-wide text-secondary uppercase">
          Areas worth reviewing
        </h2>
        <Text tone="secondary" className="mt-2 text-sm">
          Clause-level findings will appear here after the analysis milestone. The key sections to
          read first:
        </Text>
        <ul className="mt-3 flex flex-col gap-2">
          {highlighted.map((section) => (
            <li key={section.id}>
              <a
                href={`/review/${document.id}#viewer-${section.id}`}
                className="text-accent underline underline-offset-2"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" href={`/review/${document.id}`}>
          Review document
        </Button>
        <Button variant="secondary" size="lg" href="/compare">
          Compare another version
        </Button>
      </div>
    </div>
  );
}
