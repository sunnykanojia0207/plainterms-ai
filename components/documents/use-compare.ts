"use client";

/**
 * useCompare — runs semantic comparison for a document pair.
 * Statuses mirror useAnalysis: idle → loading → ready | error | unavailable.
 * Only validated domain comparisons reach the UI.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Comparison } from "@/lib/domain/types";

export type CompareStatus = "idle" | "loading" | "ready" | "error" | "unavailable";

export interface CompareSide {
  readonly documentId: string;
  readonly fixtureId: string;
  readonly title: string;
  readonly version: number;
}

export function useCompare(left: CompareSide | null, right: CompareSide | null, nonce: number) {
  const [status, setStatus] = useState<CompareStatus>("idle");
  const [data, setData] = useState<Comparison | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const leftId = left?.documentId ?? null;
  const leftFixture = left?.fixtureId ?? null;
  const leftTitle = left?.title ?? null;
  const leftVersion = left?.version ?? null;
  const rightId = right?.documentId ?? null;
  const rightFixture = right?.fixtureId ?? null;
  const rightTitle = right?.title ?? null;
  const rightVersion = right?.version ?? null;
  const key =
    leftId === null || rightId === null || leftId === rightId
      ? null
      : `${leftId}|${rightId}|${nonce}`;

  const load = useCallback(async () => {
    if (
      leftId === null ||
      leftFixture === null ||
      leftTitle === null ||
      leftVersion === null ||
      rightId === null ||
      rightFixture === null ||
      rightTitle === null ||
      rightVersion === null ||
      leftId === rightId
    ) {
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          left: {
            documentId: leftId,
            fixtureId: leftFixture,
            title: leftTitle,
            version: leftVersion,
          },
          right: {
            documentId: rightId,
            fixtureId: rightFixture,
            title: rightTitle,
            version: rightVersion,
          },
        }),
        signal: controller.signal,
      });
      if (response.status === 503) {
        setStatus("unavailable");
        return;
      }
      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setErrorMessage(
          typeof problem?.message === "string"
            ? problem.message
            : "Comparison failed unexpectedly.",
        );
        setStatus("error");
        return;
      }
      const payload = (await response.json()) as Comparison;
      setData(payload);
      setStatus("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setErrorMessage("Comparison failed unexpectedly.");
      setStatus("error");
    }
  }, [
    leftId,
    leftFixture,
    leftTitle,
    leftVersion,
    rightId,
    rightFixture,
    rightTitle,
    rightVersion,
  ]);

  // Auto-run when both sides are chosen (and on explicit re-runs via nonce).
  useEffect(() => {
    if (key === null) {
      return;
    }
    const task = Promise.resolve().then(() => load());
    return () => {
      abortRef.current?.abort();
      void task.catch(() => {
        // load() handles its own errors; this guards the chain itself.
      });
    };
  }, [key, load]);

  return { status, data, errorMessage, retry: load };
}
