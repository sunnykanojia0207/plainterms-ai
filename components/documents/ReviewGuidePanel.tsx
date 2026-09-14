"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { AISkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useReviewGuide } from "@/components/documents/use-review-guide";
import { useDocuments } from "@/lib/documents/store";
import type { ReviewGuideItem, ReviewGuideItemKind } from "@/lib/domain/types";

interface ReviewGuidePanelProps {
  readonly documentId: string;
  readonly fixtureId: string;
  readonly title: string;
  readonly version: number;
  readonly onSelectSection: (sectionId: string) => void;
}

const KIND_HEADING: Record<ReviewGuideItemKind, string> = {
  topic: "Topics worth discussing",
  "party-question": "Questions for the other party",
  "lawyer-question": "Questions for a legal professional",
  clarification: "Suggested clarifications",
  confirm: "Information to confirm",
  checklist: "Before-signing checklist",
};

const PRIORITY_TONE = {
  high: "accent",
  medium: "neutral",
  low: "neutral",
} as const;

const PRIORITY_LABEL = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
} as const;

/** Extracts one ## section from the exported Markdown for section copy. */
export function extractMarkdownSection(markdown: string, heading: string): string {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) {
    return "";
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return [...lines.slice(start, start + 1), ...rest.slice(0, end === -1 ? undefined : end)]
    .join("\n")
    .trim();
}

/**
 * Review Guide: conversation preparation in compact tabs, integrated in the
 * Review workspace. Jumps stay same-tab for the open document and open a
 * new tab for compared documents, preserving context either way.
 */
export function ReviewGuidePanel({
  documentId,
  fixtureId,
  title,
  version,
  onSelectSection,
}: ReviewGuidePanelProps) {
  const documents = useDocuments();
  const { status, guide, markdown, errorMessage, generate, cancel } = useReviewGuide();
  const { notify } = useToast();
  const [compareId, setCompareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const others = documents.filter((doc) => doc.id !== documentId);
  const compareDoc =
    compareId === null ? null : (others.find((doc) => doc.id === compareId) ?? null);

  function start(): void {
    setCopied(false);
    const compareWith =
      compareDoc === null
        ? null
        : {
            documentId: compareDoc.id,
            fixtureId: compareDoc.fixtureId,
            title: compareDoc.title,
            version: compareDoc.currentVersion,
          };
    void generate({ documentId, fixtureId, title, version, compareWith });
  }

  async function copyText(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label === "all");
      notify(label === "all" ? "Review Guide copied as Markdown." : "Section copied.");
    } catch {
      notify("Copy isn't available in this browser context.");
    }
  }

  if (status === "idle") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-bg px-4 py-5">
        <p className="text-base font-medium">Prepare to discuss</p>
        <Text tone="secondary" className="text-sm">
          Turn this review into discussion topics, questions, clarifications, and a checklist — each
          traced to the document.
        </Text>
        <div>
          <Button size="sm" onClick={start}>
            Review Guide
          </Button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-3" role="status" aria-label="Preparing Review Guide">
        <p className="text-sm text-text-secondary">Preparing your Review Guide…</p>
        <AISkeleton />
        <div>
          <Button variant="secondary" size="sm" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <GuideNotice
        title="Review Guide is temporarily unavailable"
        detail="The generation service isn't reachable. Your document and review are untouched."
        actionLabel="Retry"
        onAction={start}
      />
    );
  }

  if (status === "error") {
    return (
      <GuideNotice
        title="The guide didn't come back"
        detail={errorMessage ?? "Something went wrong. Your document and review are untouched."}
        actionLabel="Retry"
        onAction={start}
      />
    );
  }

  if (guide === null) {
    return null;
  }

  const byKind = (kind: ReviewGuideItemKind) => guide.items.filter((item) => item.kind === kind);
  const highPriority = guide.items.filter((item) => item.priority === "high").slice(0, 3);
  const jumpFor = (item: ReviewGuideItem) => {
    if (item.evidence === null) {
      return null;
    }
    if (item.evidence.documentId === documentId) {
      return { mode: "same-tab" as const, sectionId: item.evidence.sectionId };
    }
    return {
      mode: "new-tab" as const,
      href: `/review/${item.evidence.documentId}#viewer-${item.evidence.sectionId}`,
    };
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-text-secondary">
          PlainTerms prepared this guide from the document
          {guide.compareDocumentId === null ? "." : " and its comparison."}
        </p>
        <Button variant="tertiary" size="sm" onClick={start}>
          Regenerate
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Select
          label="Compare with (optional)"
          value={compareDoc?.id ?? ""}
          onChange={(event) => setCompareId(event.target.value || null)}
          options={[
            { value: "", label: "This document alone" },
            ...others.map((doc) => ({
              value: doc.id,
              label: `${doc.title} (v${doc.currentVersion})`,
            })),
          ]}
        />
        <p className="text-xs text-text-secondary">
          Changing the comparison applies the next time you generate.
        </p>
      </div>

      <Tabs
        label="Review Guide sections"
        items={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="flex flex-col gap-3">
                <ul className="flex flex-col gap-1 text-sm">
                  {(Object.keys(KIND_HEADING) as readonly ReviewGuideItemKind[]).map((kind) => {
                    const count = byKind(kind).length;
                    if (count === 0) {
                      return null;
                    }
                    return (
                      <li key={kind}>
                        {KIND_HEADING[kind]} · {count}
                      </li>
                    );
                  })}
                </ul>
                {highPriority.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold">Start here</p>
                    {highPriority.map((item) => (
                      <GuideItemCard
                        key={item.id}
                        item={item}
                        jump={jumpFor(item)}
                        onJump={onSelectSection}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ),
          },
          {
            id: "discuss",
            label: `Discuss (${byKind("topic").length + byKind("clarification").length})`,
            content: (
              <div className="flex flex-col gap-4">
                <ItemList
                  heading="Topics worth discussing"
                  items={byKind("topic")}
                  empty="No discussion topics were generated."
                  jumpFor={jumpFor}
                  onJump={onSelectSection}
                />
                <ItemList
                  heading="Suggested clarifications"
                  items={byKind("clarification")}
                  empty="No clarifications were generated."
                  jumpFor={jumpFor}
                  onJump={onSelectSection}
                />
              </div>
            ),
          },
          {
            id: "questions",
            label: `Questions (${byKind("party-question").length + byKind("lawyer-question").length})`,
            content: (
              <div className="flex flex-col gap-4">
                <ItemList
                  heading="Questions for the other party"
                  items={byKind("party-question")}
                  empty="No party questions were generated."
                  jumpFor={jumpFor}
                  onJump={onSelectSection}
                />
                {byKind("lawyer-question").length > 0 ? (
                  <div className="rounded-md border border-ai/40 bg-ai-bg/40 px-3 py-2">
                    <p className="text-sm font-semibold">
                      For discussion with a qualified legal professional
                    </p>
                    <div className="mt-2 flex flex-col gap-2">
                      {byKind("lawyer-question").map((item) => (
                        <GuideItemCard
                          key={item.id}
                          item={item}
                          jump={jumpFor(item)}
                          onJump={onSelectSection}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ),
          },
          {
            id: "checklist",
            label: `Checklist (${byKind("checklist").length + byKind("confirm").length})`,
            content: (
              <div className="flex flex-col gap-4">
                <ItemList
                  heading="Before-signing checklist"
                  items={byKind("checklist")}
                  empty="No checklist items were generated."
                  jumpFor={jumpFor}
                  onJump={onSelectSection}
                />
                <ItemList
                  heading="Information to confirm"
                  items={byKind("confirm")}
                  empty="Nothing further needs confirming."
                  jumpFor={jumpFor}
                  onJump={onSelectSection}
                />
              </div>
            ),
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button variant="secondary" size="sm" onClick={() => void copyText(markdown ?? "", "all")}>
          {copied ? "Copied" : "Copy all"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            void copyText(
              extractMarkdownSection(markdown ?? "", "Topics worth discussing"),
              "section",
            )
          }
        >
          Copy topics
        </Button>
        <Button variant="secondary" size="sm" onClick={() => window.print()}>
          Print
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={true}
          title="PDF export arrives with the export backend"
        >
          Export PDF
        </Button>
      </div>
      <p className="text-xs text-text-secondary">
        Copy and print use this guide&apos;s content. PDF export arrives with the export backend.
      </p>
    </div>
  );
}

function GuideNotice({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  readonly title: string;
  readonly detail: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
}) {
  return (
    <Card>
      <p className="text-base font-medium">{title}</p>
      <Text tone="secondary" className="mt-1 text-sm">
        {detail}
      </Text>
      <div className="mt-3">
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}

type JumpTarget =
  | { readonly mode: "same-tab"; readonly sectionId: string }
  | { readonly mode: "new-tab"; readonly href: string };

function ItemList({
  heading,
  items,
  empty,
  jumpFor,
  onJump,
}: {
  readonly heading: string;
  readonly items: readonly ReviewGuideItem[];
  readonly empty: string;
  readonly jumpFor: (item: ReviewGuideItem) => JumpTarget | null;
  readonly onJump: (sectionId: string) => void;
}) {
  return (
    <section aria-label={heading} className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
        {heading}
      </h3>
      {items.length === 0 ? (
        <Text tone="secondary" className="text-sm">
          {empty}
        </Text>
      ) : (
        items.map((item) => (
          <GuideItemCard key={item.id} item={item} jump={jumpFor(item)} onJump={onJump} />
        ))
      )}
    </section>
  );
}

function GuideItemCard({
  item,
  jump,
  onJump,
}: {
  readonly item: ReviewGuideItem;
  readonly jump: JumpTarget | null;
  readonly onJump: (sectionId: string) => void;
}) {
  return (
    <article className="rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={PRIORITY_TONE[item.priority]}>{PRIORITY_LABEL[item.priority]}</Badge>
      </div>
      <h4 className="mt-2 text-[15px] font-semibold">{item.title}</h4>
      <p className="mt-1 text-sm">{item.summary}</p>
      {item.evidence !== null ? (
        <blockquote className="font-doc mt-2 border-l-2 border-evidence-border bg-evidence/40 px-3 py-2 text-[15px]">
          “{item.evidence.quote}”
          <footer className="font-evidence mt-1 text-xs text-text-secondary">
            {item.evidence.location}
          </footer>
        </blockquote>
      ) : (
        <p className="mt-2 text-sm text-text-secondary">
          Not stated in the document — confirm independently.
        </p>
      )}
      {item.uncertainty !== null ? (
        <p className="mt-2 text-sm text-text-secondary">{item.uncertainty}</p>
      ) : null}
      {jump === null ? null : jump.mode === "same-tab" ? (
        <div className="mt-2">
          <Button variant="tertiary" size="sm" onClick={() => onJump(jump.sectionId)}>
            View source
          </Button>
        </div>
      ) : (
        <p className="mt-2">
          <a
            href={jump.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent underline underline-offset-2"
          >
            View source in compared document <span aria-hidden="true">↗</span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </p>
      )}
    </article>
  );
}
