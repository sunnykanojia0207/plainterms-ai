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
    title: "Understand",
    detail: "A plain-language summary of what the agreement says.",
  },
  {
    title: "Clause intelligence",
    detail: "The clauses that matter, explained and source-linked.",
  },
  {
    title: "Ask with evidence",
    detail: "Answers that cite the exact clause they rely on.",
  },
  {
    title: "Compare",
    detail: "What changed between versions, and whether it matters.",
  },
  {
    title: "Action Pack",
    detail: "Obligations, dates, negotiation points, lawyer questions.",
  },
] as const;

const WORKFLOW_STEPS = [
  {
    title: "1. Upload",
    detail: "Drop in a PDF, DOCX, or TXT. It stays in this browser tab.",
  },
  {
    title: "2. Prepare",
    detail: "PlainTerms reads the structure and gets it ready to review.",
  },
  {
    title: "3. Review",
    detail: "Read beside plain-language guidance, traced to every clause.",
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
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <section aria-labelledby="home-heading" className="flex flex-col items-start gap-4 pt-6">
        <Heading level={1} id="home-heading">
          Know what you&apos;re signing.
        </Heading>
        <Text tone="secondary" className="text-lg">
          PlainTerms reads your client contract and explains it in plain language — what you owe,
          what you risk, what changed, and what to ask before you sign.
        </Text>
        <Text tone="secondary" className="text-sm">
          Service Agreements · NDAs · Statements of Work
        </Text>
        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            onClick={() => {
              document
                .getElementById("home-upload")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            Review a document
          </Button>
          <Button variant="secondary" size="lg" href="/compare">
            Compare two versions
          </Button>
        </div>
        <p className="text-xs text-text-secondary">
          PlainTerms provides general information, not legal advice.
        </p>
      </section>

      <section aria-label="How it works" className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
          How it works
        </h2>
        <ol className="flex flex-col gap-3">
          {WORKFLOW_STEPS.map((step) => (
            <li key={step.title} className="flex gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold">{step.title}</h3>
                <Text tone="secondary" className="text-sm">
                  {step.detail}
                </Text>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Upload a document" id="home-upload">
        <UploadFlow onUploaded={handleUploaded} />
      </section>

      {continueDocument === undefined ? null : (
        <section aria-label="Continue review" className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
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
        <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
          Recent documents
        </h2>
        {recents.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Upload your first client contract above. It stays private to you and can be deleted at any time."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {recents.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
          </ul>
        )}
      </section>

      <section aria-label="What PlainTerms can help with" className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
          What PlainTerms can help with
        </h2>
        <ul className="flex flex-col gap-3">
          {CAPABILITIES.map((capability) => (
            <li key={capability.title}>
              <h3 className="text-base font-semibold">{capability.title}</h3>
              <Text tone="secondary" className="text-sm">
                {capability.detail}
              </Text>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Example insight" className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
          Example
        </h2>
        <Card className="border-l-4 border-l-ai p-4">
          <p className="text-xs font-medium tracking-wide text-ai uppercase">
            Example insight — Gemini output will look like this
          </p>
          <p className="mt-2 text-base">
            This clause appears to mean the client can delay payment to 30 days with no late fee.
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Source: §3 Payment Terms · Medium confidence
          </p>
        </Card>
      </section>
    </div>
  );
}
