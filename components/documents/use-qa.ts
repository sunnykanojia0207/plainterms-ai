"use client";

/**
 * useAsk — submit-driven Q&A against POST /api/ask. No auto-fetch:
 * questions send explicitly from event handlers, cancel aborts in flight,
 * retry re-sends. ask() resolves with the outcome so callers record
 * threads and history in the same event handler — no completion effects.
 * Draft text lives with the caller so cancelling never loses input.
 */
import { useCallback, useRef, useState } from "react";
import type { AIResponse } from "@/lib/domain/types";

export type AskStatus = "idle" | "loading" | "ready" | "error" | "unavailable";

export interface AskDocument {
  readonly documentId: string;
  readonly fixtureId: string;
  readonly title: string;
  readonly version: number;
}

export interface AskTurn {
  readonly question: string;
  readonly sectionId: string | null;
  readonly status: AskStatus;
  readonly response: AIResponse | null;
  readonly errorMessage: string | null;
}

export type SettledStatus = "ready" | "error" | "unavailable";

export interface AskOutcome {
  readonly status: SettledStatus | "cancelled";
  readonly response: AIResponse | null;
  readonly errorMessage: string | null;
}

interface HistoryTurn {
  readonly question: string;
  readonly answerSummary: string;
}

type SettledOutcome = {
  readonly status: SettledStatus;
  readonly response: AIResponse | null;
  readonly errorMessage: string | null;
};

function finishedTurn(
  question: string,
  sectionId: string | null,
  outcome: SettledOutcome,
): AskTurn {
  return {
    question,
    sectionId,
    status: outcome.status,
    response: outcome.response,
    errorMessage: outcome.errorMessage,
  };
}

export function useAsk() {
  const [turn, setTurn] = useState<AskTurn | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ask = useCallback(
    async (
      documents: readonly AskDocument[],
      question: string,
      options?: {
        readonly sectionId?: string | null;
        readonly history?: readonly HistoryTurn[];
      },
    ): Promise<AskOutcome> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const sectionId = options?.sectionId ?? null;
      setTurn({ question, sectionId, status: "loading", response: null, errorMessage: null });
      const settle = (outcome: SettledOutcome): SettledOutcome => {
        setTurn(finishedTurn(question, sectionId, outcome));
        return outcome;
      };
      try {
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            documents,
            question,
            sectionId,
            history: (options?.history ?? []).slice(-3),
          }),
          signal: controller.signal,
        });
        if (response.status === 503) {
          return settle({ status: "unavailable", response: null, errorMessage: null });
        }
        if (!response.ok) {
          const problem = (await response.json().catch(() => null)) as {
            message?: string;
          } | null;
          return settle({
            status: "error",
            response: null,
            errorMessage:
              typeof problem?.message === "string"
                ? problem.message
                : "The answer didn't come back.",
          });
        }
        const payload = (await response.json()) as AIResponse;
        return settle({ status: "ready", response: payload, errorMessage: null });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return { status: "cancelled", response: null, errorMessage: null };
        }
        return settle({
          status: "error",
          response: null,
          errorMessage: "The answer didn't come back.",
        });
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setTurn((current) => (current === null || current.status !== "loading" ? current : null));
  }, []);

  return { turn, ask, cancel };
}
