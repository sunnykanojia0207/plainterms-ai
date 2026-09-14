"use client";

/**
 * useActionPack — submit-driven pack generation against
 * POST /api/action-pack/[documentId]. Create/Regenerate/Retry send
 * explicitly; cancel aborts in flight. Markdown arrives with the pack
 * for honest copy-to-clipboard (no export backend involved).
 */
import { useCallback, useRef, useState } from "react";
import type { ActionPack } from "@/lib/domain/types";

export type PackStatus = "idle" | "loading" | "ready" | "error" | "unavailable";

export interface PackDescriptor {
  readonly documentId: string;
  readonly fixtureId: string;
  readonly title: string;
  readonly version: number;
}

export function useActionPack() {
  const [status, setStatus] = useState<PackStatus>("idle");
  const [pack, setPack] = useState<ActionPack | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (descriptor: PackDescriptor) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/action-pack/${descriptor.documentId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fixtureId: descriptor.fixtureId,
          title: descriptor.title,
          version: descriptor.version,
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
          typeof problem?.message === "string" ? problem.message : "The pack didn't come back.",
        );
        setStatus("error");
        return;
      }
      const payload = (await response.json()) as {
        pack: ActionPack;
        markdown: string;
      };
      setPack(payload.pack);
      setMarkdown(payload.markdown);
      setStatus("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setErrorMessage("The pack didn't come back.");
      setStatus("error");
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus((current) => (current === "loading" ? "idle" : current));
  }, []);

  return { status, pack, markdown, errorMessage, generate, cancel };
}
