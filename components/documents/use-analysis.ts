"use client";

/**
 * useAnalysis — fetches validated Gemini analysis for one document.
 * Statuses: idle → loading → ready | error | unavailable.
 * The hook never exposes prompts, keys, or raw model output — only the
 * validated API payload. Retries re-fetch on demand.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Clause, KeyDate, ObligationItem, ReviewFinding } from "@/lib/domain/types";

export type AnalysisStatus = "idle" | "loading" | "ready" | "error" | "unavailable";

export interface AnalysisData {
  readonly summary: string;
  readonly keyFacts: readonly string[];
  readonly findings: readonly ReviewFinding[];
  readonly clauses: readonly Clause[];
  readonly obligations: readonly ObligationItem[];
  readonly dates: readonly KeyDate[];
}

interface AnalysisRequest {
  readonly documentId: string;
  readonly fixtureId: string;
  readonly title: string;
  readonly version: number;
}

export function useAnalysis(request: AnalysisRequest | null) {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [data, setData] = useState<AnalysisData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Primitive deps: the request object identity is unstable across renders.
  const documentId = request?.documentId ?? null;
  const fixtureId = request?.fixtureId ?? null;
  const title = request?.title ?? null;
  const version = request?.version ?? null;
  const key =
    documentId === null || fixtureId === null || title === null || version === null
      ? null
      : `${documentId}|${fixtureId}|${title}|${version}`;

  const load = useCallback(async () => {
    if (documentId === null || fixtureId === null || title === null || version === null) {
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/analysis/${documentId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fixtureId, title, version }),
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
          typeof problem?.message === "string" ? problem.message : "Analysis failed unexpectedly.",
        );
        setStatus("error");
        return;
      }
      const payload = (await response.json()) as AnalysisData;
      setData(payload);
      setStatus("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setErrorMessage("Analysis failed unexpectedly.");
      setStatus("error");
    }
  }, [documentId, fixtureId, title, version]);

  useEffect(() => {
    if (key === null) {
      return;
    }
    // Kick off asynchronously: state transitions happen in the fetch
    // callbacks, keeping the effect body free of synchronous updates.
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
