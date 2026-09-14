"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { DocumentRow } from "@/components/documents/DocumentsLibrary";
import { UploadFlow } from "@/components/documents/UploadFlow";
import type { UploadedRecord } from "@/lib/documents/upload-client";
import { addUploadRecord, useDocuments } from "@/lib/documents/store";

const CAPABILITIES = [
  {
    mark: "◈",
    title: "Understand",
    detail: "A plain-language summary of what the agreement says.",
  },
  {
    mark: "§",
    title: "Clause intelligence",
    detail: "The clauses that matter, explained and source-linked.",
  },
  {
    mark: "❝",
    title: "Ask with evidence",
    detail: "Answers that cite the exact clause they rely on.",
  },
  {
    mark: "⇄",
    title: "Compare",
    detail: "What changed between versions, and whether it matters.",
  },
  {
    mark: "☑",
    title: "Action Pack",
    detail: "Obligations, dates, negotiation points, lawyer questions.",
  },
] as const;

const WORKFLOW_STEPS = [
  {
    number: "01",
    title: "Upload",
    detail: "Drop in a PDF, DOCX, or TXT. It stays in this browser tab.",
  },
  {
    number: "02",
    title: "Understand",
    detail: "PlainTerms reads the structure and explains it in plain language.",
  },
  {
    number: "03",
    title: "Verify",
    detail: "Every claim traces to its clause. Check the source before you sign.",
  },
] as const;

/**
 * Home — the starting line: identity, value, workflow, supported types,
 * upload, recents with continue-review, capability preview, trust messaging.
 */
export default function HomePage() {
  const router = useRouter();
  const documents = useDocuments();
  const recents = [...documents].reverse().slice(0, 3);
  const continueDocument = [...documents].reverse().find((document) => document.status === "ready");

  function handleUploaded(record: UploadedRecord): void {
    const document = addUploadRecord({
      id: record.id,
      title: record.title,
      type: record.type,
      pageCount: record.pageCount,
      fileName: record.fileName,
      sizeBytes: record.sizeBytes,
      sections: record.sections,
      typeConfident: record.typeConfident,
    });
    router.push(`/processing/${document.id}`);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10">
      <section
        aria-labelledby="home-heading"
        className="grid items-center gap-10 pt-6 lg:grid-cols-2"
      >
        <div className="flex flex-col items-start gap-4">
          <p className="font-evidence text-xs font-semibold tracking-widest text-tertiary uppercase">
            PlainTerms · Contract intelligence
          </p>
          <Heading
            level={1}
            variant="display"
            id="home-heading"
            className="font-bold [font-family:var(--font-doc)]"
          >
            Know what you&apos;re signing.
          </Heading>
          <Text tone="secondary" className="max-w-[52ch] text-lg">
            Understand contracts, compare versions, and prepare better questions before you sign.
          </Text>
          <Text tone="secondary" className="text-sm">
            PDF · DOCX · TXT — Service Agreements · NDAs · Statements of Work
          </Text>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => {
                const target = document.getElementById("home-upload");
                if (target === null) {
                  return;
                }
                const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
                target.focus({ preventScroll: true });
              }}
            >
              Review a document
            </Button>
            <Button variant="secondary" size="lg" href="/compare">
              Compare two versions
            </Button>
          </div>
          <p className="text-xs text-secondary">
            PlainTerms provides general information, not legal advice.
          </p>
        </div>
        <div aria-label="Example insight" className="relative">
          <Card className="font-doc" labelledBy={undefined}>
            <p className="text-xs font-semibold tracking-wide text-secondary uppercase">
              Independent Contractor Services Agreement
            </p>
            <p className="mt-3">
              This Independent Contractor Services Agreement (the “Agreement”) is entered into as of
              October 1, 2026, by and between Brightline Studio LLC (the “Client”) and Maya Chen
              (the “Contractor”).
            </p>
            <p className="mt-2 text-sm text-secondary">
              §3 Payment Terms · Invoices are payable net fifteen (15) days from receipt.
            </p>
          </Card>
          <Card className="mt-3 border-l-[3px] border-l-ai-accent bg-ai-muted sm:ml-8">
            <p className="text-xs font-medium tracking-wide text-ai-accent uppercase">
              Example insight — Gemini output will look like this
            </p>
            <p className="mt-2 text-base">
              This clause appears to mean the client can delay payment to 30 days with no late fee.
            </p>
            <p className="mt-1 text-sm text-secondary">
              Source: §3 Payment Terms · Medium confidence
            </p>
          </Card>
        </div>
      </section>

      <section aria-label="How it works" className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold tracking-wide text-secondary uppercase">
          How it works
        </h2>
        <ol className="grid gap-6 sm:grid-cols-3 sm:gap-8">
          {WORKFLOW_STEPS.map((step) => (
            <li key={step.number} className="flex min-w-0 flex-col gap-1">
              <span
                aria-hidden="true"
                className="font-doc text-2xl font-bold text-tertiary tabular-nums"
              >
                {step.number}
              </span>
              <h3 className="text-base font-semibold">{step.title}</h3>
              <Text tone="secondary" className="text-sm">
                {step.detail}
              </Text>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Upload a document" id="home-upload" tabIndex={-1}>
        <UploadFlow onUploaded={handleUploaded} />
      </section>

      {continueDocument === undefined ? null : (
        <section aria-label="Continue review" className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-secondary uppercase">
            Continue review
          </h2>
          <Card className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{continueDocument.title}</p>
              <Text tone="secondary" className="text-sm">
                Pick up where you left off.
              </Text>
            </div>
            <Button size="sm" href={`/review/${continueDocument.id}`}>
              Open review
            </Button>
          </Card>
        </section>
      )}

      <section aria-label="Recent documents" className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-secondary uppercase">
          Recent documents
        </h2>
        {recents.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Upload your first client contract above. It stays private to you and can be deleted at any time."
            action={
              <Button
                size="sm"
                onClick={() => {
                  const target = document.getElementById("home-upload");
                  if (target === null) {
                    return;
                  }
                  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
                  target.focus({ preventScroll: true });
                }}
              >
                Upload a document
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {recents.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
          </ul>
        )}
      </section>

      <section aria-label="What PlainTerms can help with" className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-secondary uppercase">
          What PlainTerms can help with
        </h2>
        <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability) => (
            <li key={capability.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-muted text-base text-accent"
              >
                {capability.mark}
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold">{capability.title}</h3>
                <Text tone="secondary" className="mt-0.5 text-sm">
                  {capability.detail}
                </Text>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
