"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/utils/cn";
import {
  AbortError,
  createProcessingDriver,
  PROCESSING_STAGES,
  type ProcessingOutcome,
} from "@/lib/documents/processing";
import { removeDocument, setDocumentStatus, useDocument } from "@/lib/documents/store";

/** Human-paced delay between stages. Tests drive the engine with delay 0. */
const UI_STAGE_DELAY_MS = 850;

type RunState = "running" | "failed" | "cancelled";

interface ProcessingViewProps {
  readonly documentId: string;
  readonly initialOutcome: ProcessingOutcome;
}

/**
 * Deterministic processing run: advances the engine through every stage,
 * announces each one, then hands off to Ready. Cancel aborts cleanly;
 * failure offers retry. No percentages, no model claims — preparation only.
 */
export function ProcessingView({ documentId, initialOutcome }: ProcessingViewProps) {
  const router = useRouter();
  const document = useDocument(documentId);
  const [stageIndex, setStageIndex] = useState(0);
  const [runState, setRunState] = useState<RunState>("running");
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Launches a driver run. All state transitions happen inside async
   * driver/promise callbacks; this function performs no synchronous
   * state updates itself, so it is safe to call from effects and events.
   */
  function launch(controller: AbortController, outcome: ProcessingOutcome): void {
    abortRef.current = controller;
    createProcessingDriver(UI_STAGE_DELAY_MS)
      .run(
        (_stage, index) => {
          setStageIndex(index);
        },
        { signal: controller.signal, outcome },
      )
      .then(() => {
        setDocumentStatus(documentId, "ready");
        router.replace(`/ready/${documentId}`);
      })
      .catch((error: unknown) => {
        if (error instanceof AbortError) {
          setDocumentStatus(documentId, "uploaded");
          setRunState("cancelled");
          return;
        }
        setDocumentStatus(documentId, "failed");
        setRunState("failed");
      });
  }

  /** Event-handler entry points (retry/resume): reset synchronously, then launch. */
  function restart(outcome: ProcessingOutcome): void {
    setRunState("running");
    setStageIndex(0);
    setDocumentStatus(documentId, "processing");
    launch(new AbortController(), outcome);
  }

  useEffect(() => {
    if (document === null) {
      return;
    }
    // An explicit ?outcome=fail is a demo/test instruction and always runs,
    // even over an already-ready document, so failure is deterministic.
    // Otherwise ready documents skip straight ahead.
    if (document.status === "ready" && initialOutcome !== "failure") {
      router.replace(`/ready/${documentId}`);
      return;
    }
    // Initial state already represents a fresh run (stage 0, running);
    // the effect only synchronizes the external driver + navigation.
    // No start-once guard: StrictMode remounts abort the first run via
    // cleanup, and the second mount relaunches cleanly.
    launch(new AbortController(), initialOutcome);
    return () => {
      abortRef.current?.abort();
    };
    // Status changes flow through the store (not this effect's deps), so a
    // completing run cannot relaunch itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  if (document === null) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <ErrorState
          kind="not-found"
          detail="This document doesn't exist or was deleted. Upload it again to review it."
          action={
            <Button size="sm" href="/">
              Upload a document
            </Button>
          }
        />
      </div>
    );
  }

  if (runState === "failed") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 py-10">
        <Heading level={1}>We couldn&apos;t prepare that document</Heading>
        <div role="alert" className="rounded-lg border border-critical/40 bg-critical-bg px-4 py-3">
          <Text>
            “{document.title}” couldn&apos;t be prepared for review. Your file is unchanged —
            nothing was lost.
          </Text>
        </div>
        <Text tone="secondary">
          This can happen with a damaged or protected file. Try again, or choose a different PDF,
          DOCX, or TXT file.
        </Text>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => restart("success")}>Retry</Button>
          <Button variant="secondary" href="/">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (runState === "cancelled") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 py-10">
        <Heading level={1}>Preparation cancelled</Heading>
        <Text tone="secondary">
          “{document.title}” was left as uploaded. Resume preparation, or discard it and start over.
        </Text>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => restart("success")}>Resume</Button>
          <Button
            variant="secondary"
            onClick={() => {
              removeDocument(documentId);
              router.push("/");
            }}
          >
            Discard
          </Button>
        </div>
      </div>
    );
  }

  const current = PROCESSING_STAGES[stageIndex] ?? PROCESSING_STAGES[0];
  if (current === undefined) {
    return null;
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-6">
      <div className="flex flex-col gap-1">
        <Heading level={1}>Preparing your document</Heading>
        <Text tone="secondary">
          “{document.title}” — getting it ready to read. Legal analysis happens in a later step, not
          here.
        </Text>
      </div>
      <ol aria-label="Preparation progress" className="flex flex-col gap-3">
        {PROCESSING_STAGES.map((stage, index) => {
          const done = index < stageIndex;
          const active = index === stageIndex;
          return (
            <li
              key={stage.id}
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-sm",
                  done && "bg-success-bg text-success",
                  active && "bg-accent/10 text-accent",
                  !done && !active && "bg-neutral-bg text-text-secondary",
                )}
              >
                {done ? "✓" : active ? "●" : "○"}
              </span>
              <span className={cn("text-base", active ? "font-medium" : "text-text-secondary")}>
                {stage.label}
                {stage.id === "ready" ? "" : "…"}
              </span>
            </li>
          );
        })}
      </ol>
      <p aria-live="polite" className="sr-only">
        {current.announcement}
      </p>
      <div>
        <Button variant="secondary" onClick={() => abortRef.current?.abort()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
