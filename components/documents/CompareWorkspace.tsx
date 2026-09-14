"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Heading } from "@/components/ui/Heading";
import { Select } from "@/components/ui/Select";
import { AISkeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { ChangeDetail, SilenceCard } from "@/components/documents/ComparisonDetail";
import { useCompare } from "@/components/documents/use-compare";
import { useDocuments } from "@/lib/documents/store";
import type { ComparisonChange } from "@/lib/domain/types";
import { cn } from "@/lib/utils/cn";

type KindFilter = "all" | "potentially-important" | "changed" | "added" | "removed" | "uncertain";

type SortKey = "important" | "document" | "category" | "confidence";

const CONFIDENCE_RANK = {
  "very-high": 0,
  high: 1,
  moderate: 2,
  low: 3,
} as const;

function pageOf(ref: string | null): number {
  if (ref === null) {
    return Number.POSITIVE_INFINITY;
  }
  const match = /p\.\s*(\d+)/.exec(ref);
  return match?.[1] === undefined ? Number.POSITIVE_INFINITY : Number(match[1]);
}

function sortChanges(
  changes: readonly ComparisonChange[],
  sort: SortKey,
): readonly ComparisonChange[] {
  const list = [...changes];
  switch (sort) {
    case "important":
      return list.sort(
        (a, b) =>
          Number(b.materiality === "material") - Number(a.materiality === "material") ||
          CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence],
      );
    case "document":
      return list.sort(
        (a, b) =>
          Math.min(pageOf(a.leftRef), pageOf(a.rightRef)) -
          Math.min(pageOf(b.leftRef), pageOf(b.rightRef)),
      );
    case "category":
      return list.sort((a, b) => a.category.localeCompare(b.category));
    case "confidence":
      return list.sort((a, b) => CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]);
  }
}

const KIND_LABEL: Record<ComparisonChange["type"], string> = {
  changed: "Changed",
  added: "Added",
  removed: "Removed",
};

/**
 * Comparison workspace: version setup, verdict, filters, change navigator,
 * semantic redline detail, silence findings, and unchanged counts.
 * Counts always come from validated results — never fabricated.
 */
export function CompareWorkspace() {
  const documents = useDocuments();
  const [leftPick, setLeftPick] = useState<string | null>(null);
  const [rightPick, setRightPick] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("important");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);

  const leftDoc = documents.find((doc) => doc.id === (leftPick ?? documents[0]?.id)) ?? null;
  const rightDoc = documents.find((doc) => doc.id === (rightPick ?? documents[1]?.id)) ?? null;
  const sameSelection = leftDoc !== null && rightDoc !== null && leftDoc.id === rightDoc.id;

  const { status, data, errorMessage, retry } = useCompare(
    leftDoc === null
      ? null
      : {
          documentId: leftDoc.id,
          fixtureId: leftDoc.fixtureId,
          title: leftDoc.title,
          version: leftDoc.currentVersion,
        },
    rightDoc === null
      ? null
      : {
          documentId: rightDoc.id,
          fixtureId: rightDoc.fixtureId,
          title: rightDoc.title,
          version: rightDoc.currentVersion,
        },
    nonce,
  );

  const categories = useMemo(() => {
    const set = new Set((data?.changes ?? []).map((change) => change.category));
    return [...set].sort();
  }, [data]);

  const visibleChanges = useMemo(() => {
    if (data === null) {
      return [];
    }
    const filtered = data.changes.filter((change) => {
      if (kindFilter === "potentially-important" && change.materiality !== "material") {
        return false;
      }
      if (kindFilter === "changed" || kindFilter === "added" || kindFilter === "removed") {
        if (change.type !== kindFilter) {
          return false;
        }
      }
      if (kindFilter === "uncertain" && change.confidence !== "low") {
        return false;
      }
      if (categoryFilter !== "all" && change.category !== categoryFilter) {
        return false;
      }
      return true;
    });
    return sortChanges(filtered, sort);
  }, [data, kindFilter, categoryFilter, sort]);

  const visibleSilence = useMemo(() => {
    if (data === null) {
      return [];
    }
    if (kindFilter === "uncertain") {
      return data.silence.filter((finding) => finding.state === "uncertain");
    }
    if (kindFilter !== "all" && kindFilter !== "potentially-important") {
      return [];
    }
    return data.silence;
  }, [data, kindFilter]);

  const selected =
    visibleChanges.find((change) => change.id === selectedId) ??
    visibleChanges.find((change) => change.materiality === "material") ??
    visibleChanges[0];

  const options = documents.map((doc) => ({
    value: doc.id,
    label: `${doc.title} (v${doc.currentVersion})`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Heading level={1}>Compare versions</Heading>
        <Text tone="secondary">
          Choose two versions to see what changed — and whether it matters.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <Select
          label="Version 1 · earlier"
          value={leftDoc?.id ?? ""}
          onChange={(event) => setLeftPick(event.target.value || null)}
          options={[{ value: "", label: "Select a document" }, ...options]}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setLeftPick(rightDoc?.id ?? null);
            setRightPick(leftDoc?.id ?? null);
          }}
        >
          Swap
        </Button>
        <Select
          label="Version 2 · later"
          value={rightDoc?.id ?? ""}
          onChange={(event) => setRightPick(event.target.value || null)}
          options={[{ value: "", label: "Select a document" }, ...options]}
        />
      </div>

      {sameSelection ? (
        <div role="alert" className="rounded-lg border border-warning/40 bg-warning-bg px-4 py-3">
          <Text>Choose two different documents to compare.</Text>
        </div>
      ) : null}

      {(status === "loading" || status === "idle") && !sameSelection ? (
        <div className="flex flex-col gap-3" role="status" aria-label="Comparing versions">
          <p className="text-sm text-text-secondary">Gemini · Comparing versions…</p>
          <AISkeleton />
        </div>
      ) : null}

      {status === "unavailable" ? (
        <Card>
          <p className="text-base font-medium">Comparison is temporarily unavailable</p>
          <Text tone="secondary" className="mt-1 text-sm">
            The AI comparison service isn&apos;t reachable right now. Your documents are untouched —
            try again in a moment.
          </Text>
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={() => setNonce((n) => n + 1)}>
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {status === "error" ? (
        <Card>
          <p className="text-base font-medium">The comparison didn&apos;t complete</p>
          <Text tone="secondary" className="mt-1 text-sm">
            {errorMessage ?? "Comparison failed unexpectedly."} Both documents are preserved —
            adjust the selection or retry.
          </Text>
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={retry}>
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {status === "ready" && data !== null ? (
        <div className="flex flex-col gap-6">
          <Card>
            <p className="text-xs font-medium tracking-wide text-ai uppercase">
              Comparison summary
            </p>
            <p className="mt-2 text-base">{data.verdict}</p>
            <Text tone="secondary" className="mt-1 text-sm">
              {data.summary}
            </Text>
            {data.verdictDrivers.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {data.verdictDrivers.map((driver) => (
                  <li key={driver} className="rounded-full bg-neutral-bg px-2.5 py-1 text-xs">
                    {driver}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-sm text-text-secondary">
              {data.changes.length} {data.changes.length === 1 ? "change" : "changes"} ·{" "}
              {data.silence.length} silence {data.silence.length === 1 ? "finding" : "findings"} ·{" "}
              {data.unchangedCount} unchanged {data.unchangedCount === 1 ? "section" : "sections"}
            </p>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Select
              label="Show"
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value as KindFilter)}
              options={[
                { value: "all", label: "All" },
                { value: "potentially-important", label: "Potentially important" },
                { value: "changed", label: "Changed" },
                { value: "added", label: "Added" },
                { value: "removed", label: "Removed" },
                { value: "uncertain", label: "Uncertain" },
              ]}
            />
            <Select
              label="Category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              options={[
                { value: "all", label: "All categories" },
                ...categories.map((category) => ({
                  value: category,
                  label: category,
                })),
              ]}
            />
            <Select
              label="Sort by"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              options={[
                { value: "important", label: "Most important" },
                { value: "document", label: "Document order" },
                { value: "category", label: "Category" },
                { value: "confidence", label: "Confidence" },
              ]}
            />
          </div>

          {visibleChanges.length === 0 && visibleSilence.length === 0 ? (
            <EmptyState
              title="No changes match these filters"
              description="Broaden the filters to see the full comparison."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <nav aria-label="Changes" className="flex flex-col gap-2">
                {visibleChanges.map((change) => {
                  const active = selected?.id === change.id;
                  return (
                    <button
                      key={change.id}
                      type="button"
                      onClick={() => setSelectedId(change.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors",
                        active
                          ? "border-accent bg-accent/5"
                          : "border-border bg-surface hover:border-text-secondary",
                      )}
                    >
                      <span className="flex flex-wrap gap-1.5">
                        <Badge
                          tone={
                            change.type === "changed"
                              ? "warning"
                              : change.type === "added"
                                ? "success"
                                : "critical"
                          }
                        >
                          {KIND_LABEL[change.type]}
                        </Badge>
                        {change.materiality === "material" ? (
                          <Badge tone="concern">Potentially important</Badge>
                        ) : null}
                      </span>
                      <span className="text-[15px] font-medium">{change.clauseTitle}</span>
                      <span className="text-sm text-text-secondary">{change.plainExplanation}</span>
                    </button>
                  );
                })}
              </nav>
              <div>
                {selected === undefined ? (
                  <EmptyState
                    title="Select a change"
                    description="Choose a change on the left to read the original and new versions side by side."
                  />
                ) : (
                  <ChangeDetail
                    change={selected}
                    leftDocumentId={data.leftDocumentId}
                    rightDocumentId={data.rightDocumentId}
                  />
                )}
              </div>
            </div>
          )}

          {visibleSilence.length > 0 ? (
            <section aria-label="Silence findings" className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold tracking-wide text-text-secondary uppercase">
                Silence findings · {visibleSilence.length}
              </h2>
              {visibleSilence.map((finding) => (
                <SilenceCard
                  key={finding.id}
                  finding={finding}
                  leftDocumentId={data.leftDocumentId}
                  rightDocumentId={data.rightDocumentId}
                />
              ))}
            </section>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setShowUnchanged((show) => !show)}
              aria-expanded={showUnchanged}
            >
              {showUnchanged ? "Hide" : "Show"} {data.unchangedCount} unchanged{" "}
              {data.unchangedCount === 1 ? "section" : "sections"}
            </Button>
            {showUnchanged && data.unchangedCount > 0 ? (
              <p className="text-sm text-text-secondary">
                Identical in both versions and excluded from analysis.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="text-xs text-text-secondary">
        Comparison explains document differences. It is not legal advice.
      </p>
    </div>
  );
}
