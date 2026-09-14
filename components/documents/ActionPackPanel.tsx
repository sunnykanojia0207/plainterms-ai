"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { AISkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useActionPack } from "@/components/documents/use-action-pack";
import type { ActionPackItem, ActionPackItemKind } from "@/lib/domain/types";

interface ActionPackPanelProps {
  readonly documentId: string;
  readonly fixtureId: string;
  readonly title: string;
  readonly version: number;
  readonly onSelectSection: (sectionId: string) => void;
}

const KIND_HEADING: Record<ActionPackItemKind, string> = {
  obligation: "Key obligations",
  date: "Important dates",
  review: "Items worth reviewing",
  clarify: "Questions to clarify",
  lawyer: "Questions for a legal professional",
  checklist: "Before-signing checklist",
  "info-needed": "Information still needed",
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

/**
 * Action Pack: grounded preparation material in compact tabs. Lives inside
 * the Review workspace so the document stays visible; every item traces to
 * its source section. Copy and print are real; PDF export is an honest
 * disabled placeholder until the export backend exists.
 */
export function ActionPackPanel({
  documentId,
  fixtureId,
  title,
  version,
  onSelectSection,
}: ActionPackPanelProps) {
  const { status, pack, markdown, errorMessage, generate, cancel } = useActionPack();
  const { notify } = useToast();
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [copied, setCopied] = useState(false);

  function start(): void {
    setChecked(new Set());
    setCopied(false);
    void generate({ documentId, fixtureId, title, version });
  }

  async function copyPack(): Promise<void> {
    if (markdown === null) {
      return;
    }
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      notify("Action Pack copied as Markdown.");
    } catch {
      notify("Copy isn't available in this browser context.");
    }
  }

  function toggleCheck(id: string): void {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (status === "idle") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-bg px-4 py-5">
        <p className="text-base font-medium">Prepare your Action Pack</p>
        <Text tone="secondary" className="text-sm">
          Turn this review into obligations, dates, review items, questions, and a before-signing
          checklist — each traced to the document.
        </Text>
        <div>
          <Button size="sm" onClick={start}>
            Create Action Pack
          </Button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-3" role="status" aria-label="Preparing Action Pack">
        <p className="text-sm text-text-secondary">Preparing your Action Pack…</p>
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
      <PackNotice
        title="Action Pack is temporarily unavailable"
        detail="The generation service isn't reachable. Your document and review are untouched."
        actionLabel="Retry"
        onAction={start}
      />
    );
  }

  if (status === "error") {
    return (
      <PackNotice
        title="The pack didn't come back"
        detail={errorMessage ?? "Something went wrong. Your document and review are untouched."}
        actionLabel="Retry"
        onAction={start}
      />
    );
  }

  if (pack === null) {
    return null;
  }

  const byKind = (kind: ActionPackItemKind) => pack.items.filter((item) => item.kind === kind);
  const highPriority = pack.items.filter((item) => item.priority === "high").slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-text-secondary">
          PlainTerms prepared this checklist from the document.
        </p>
        <Button variant="tertiary" size="sm" onClick={start}>
          Regenerate
        </Button>
      </div>

      <Tabs
        label="Action Pack sections"
        items={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="flex flex-col gap-3">
                <ul className="flex flex-col gap-1 text-sm">
                  {(Object.keys(KIND_HEADING) as readonly ActionPackItemKind[]).map((kind) => {
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
                      <PackItemCard
                        key={item.id}
                        item={item}
                        onJump={
                          item.evidence === null
                            ? null
                            : () => onSelectSection(item.evidence?.sectionId ?? "")
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ),
          },
          {
            id: "obligations",
            label: `Obligations (${byKind("obligation").length})`,
            content: (
              <ItemList
                items={byKind("obligation")}
                empty="No explicit obligations were extracted."
                onJump={(item) =>
                  item.evidence === null
                    ? null
                    : () => onSelectSection(item.evidence?.sectionId ?? "")
                }
              />
            ),
          },
          {
            id: "dates",
            label: `Dates (${byKind("date").length})`,
            content: (
              <ItemList
                items={byKind("date")}
                empty="No explicit dates were found."
                onJump={(item) =>
                  item.evidence === null
                    ? null
                    : () => onSelectSection(item.evidence?.sectionId ?? "")
                }
              />
            ),
          },
          {
            id: "review",
            label: `Review (${byKind("review").length})`,
            content: (
              <ItemList
                items={byKind("review")}
                empty="No items were flagged for review."
                onJump={(item) =>
                  item.evidence === null
                    ? null
                    : () => onSelectSection(item.evidence?.sectionId ?? "")
                }
              />
            ),
          },
          {
            id: "questions",
            label: `Questions (${byKind("clarify").length + byKind("lawyer").length})`,
            content: (
              <div className="flex flex-col gap-4">
                <ItemList
                  items={byKind("clarify")}
                  empty="No clarification questions were generated."
                  onJump={(item) =>
                    item.evidence === null
                      ? null
                      : () => onSelectSection(item.evidence?.sectionId ?? "")
                  }
                />
                {byKind("lawyer").length > 0 ? (
                  <div className="rounded-md border border-ai/40 bg-ai-bg/40 px-3 py-2">
                    <p className="text-sm font-semibold">
                      For discussion with a qualified legal professional
                    </p>
                    <div className="mt-2 flex flex-col gap-2">
                      {byKind("lawyer").map((item) => (
                        <PackItemCard
                          key={item.id}
                          item={item}
                          onJump={
                            item.evidence === null
                              ? null
                              : () => onSelectSection(item.evidence?.sectionId ?? "")
                          }
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
            label: `Checklist (${byKind("checklist").length + byKind("info-needed").length})`,
            content: (
              <div className="flex flex-col gap-4">
                <ul className="flex flex-col gap-2">
                  {byKind("checklist").map((item) => {
                    const done = checked.has(item.id);
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          id={`pack-check-${item.id}`}
                          checked={done}
                          onChange={() => toggleCheck(item.id)}
                          className="mt-1 size-4 accent-accent"
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <label htmlFor={`pack-check-${item.id}`} className="text-sm font-medium">
                            {item.title}
                          </label>
                          <span className="text-sm text-text-secondary">{item.summary}</span>
                          {item.evidence !== null ? (
                            <button
                              type="button"
                              onClick={() => onSelectSection(item.evidence?.sectionId ?? "")}
                              className="self-start text-sm font-medium text-accent underline underline-offset-2"
                            >
                              View source
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {byKind("info-needed").length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold">Information still needed</p>
                    {byKind("info-needed").map((item) => (
                      <PackItemCard key={item.id} item={item} onJump={null} />
                    ))}
                  </div>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button variant="secondary" size="sm" onClick={() => void copyPack()}>
          {copied ? "Copied" : "Copy"}
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
        Copy and print use this pack&apos;s content. PDF export arrives with the export backend.
      </p>
    </div>
  );
}

function PackNotice({
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

function ItemList({
  items,
  empty,
  onJump,
}: {
  readonly items: readonly ActionPackItem[];
  readonly empty: string;
  readonly onJump: (item: ActionPackItem) => (() => void) | null;
}) {
  if (items.length === 0) {
    return (
      <Text tone="secondary" className="text-sm">
        {empty}
      </Text>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <PackItemCard key={item.id} item={item} onJump={onJump(item)} />
      ))}
    </div>
  );
}

function PackItemCard({
  item,
  onJump,
}: {
  readonly item: ActionPackItem;
  readonly onJump: (() => void) | null;
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
      {item.nextStep !== null ? (
        <p className="mt-1 text-sm">
          <span className="font-medium">Next step: </span>
          {item.nextStep}
        </p>
      ) : null}
      {onJump !== null ? (
        <div className="mt-2">
          <Button variant="tertiary" size="sm" onClick={onJump}>
            View source
          </Button>
        </div>
      ) : null}
    </article>
  );
}
