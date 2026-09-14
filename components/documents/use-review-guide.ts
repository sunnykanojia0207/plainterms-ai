"use client";

/**
 * useReviewGuide — submit-driven guide generation against
 * POST /api/review-guide/[documentId]. Create/regenerate explicitly;
 * cancel aborts in flight. Markdown arrives with the guide for honest
 * copy-to-clipboard (no export backend involved).
 */
import { useCallback, useRef, useState } from "react";
import type { ReviewGuide } from "@/lib/domain/types";

export type GuideStatus = "idle" | "loading" | "ready" | "error" | "unavailable";

export interface GuideDescriptor {
  readonly documentId: string;
  readonly fixtureId: string;
  readonly title: string;
  readonly version: number;
  readonly compareWith?: {
    readonly documentId: string;
    readonly fixtureId: string;
    readonly title: string;
    readonly version: number;
  } | null;
}

export function useReviewGuide() {
  const [status, setStatus] = useState<GuideStatus>("idle");
  const [guide, setGuide] = useState<ReviewGuide | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (descriptor: GuideDescriptor) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/review-guide/${descriptor.documentId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fixtureId: descriptor.fixtureId,
          title: descriptor.title,
          version: descriptor.version,
          compareWith: descriptor.compareWith ?? null,
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
          typeof problem?.message === "string" ? problem.message : "The guide didn't come back.",
        );
        setStatus("error");
        return;
      }
      const payload = (await response.json()) as {
        guide: ReviewGuide;
        markdown: string;
      };
      setGuide(payload.guide);
      setMarkdown(payload.markdown);
      setStatus("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setErrorMessage("The guide didn't come back.");
      setStatus("error");
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus((current) => (current === "loading" ? "idle" : current));
  }, []);

  return { status, guide, markdown, errorMessage, generate, cancel };
}
