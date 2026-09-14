/**
 * Deterministic processing state machine. Pure logic — no React, no timers
 * hidden inside: the driver is async with injectable delays so unit tests
 * run it instantly and the UI runs it at human pace.
 *
 * Wording rules: stages describe document preparation only. Never imply
 * legal analysis has occurred. No percentages, no model claims, no timings.
 */

export type ProcessingStageId = "uploading" | "reading" | "detecting" | "preparing" | "ready";

export interface ProcessingStage {
  readonly id: ProcessingStageId;
  readonly label: string;
  readonly announcement: string;
}

export const PROCESSING_STAGES: readonly ProcessingStage[] = [
  {
    id: "uploading",
    label: "Uploading document",
    announcement: "Uploading your document.",
  },
  {
    id: "reading",
    label: "Reading document structure",
    announcement: "Reading the document structure.",
  },
  {
    id: "detecting",
    label: "Detecting sections",
    announcement: "Detecting sections.",
  },
  {
    id: "preparing",
    label: "Preparing review",
    announcement: "Preparing your review.",
  },
  {
    id: "ready",
    label: "Ready for review",
    announcement: "Your document is ready for review.",
  },
];

export type ProcessingOutcome = "success" | "failure";

export interface ProcessingDriver {
  /** Resolves after each stage completes. Rejects with AbortError on abort. */
  run(
    onStage: (stage: ProcessingStage, index: number) => void,
    options?: { readonly signal?: AbortSignal; readonly outcome?: ProcessingOutcome },
  ): Promise<void>;
}

export class AbortError extends Error {
  constructor() {
    super("Processing was cancelled.");
    this.name = "AbortError";
  }
}

/**
 * Creates a driver that advances through every stage with a fixed delay.
 * `stageDelayMs: 0` runs synchronously for tests.
 */
export function createProcessingDriver(stageDelayMs: number): ProcessingDriver {
  return {
    run(onStage, options) {
      const outcome = options?.outcome ?? "success";
      const signal = options?.signal;
      return new Promise<void>((resolve, reject) => {
        let index = 0;
        const advance = (): void => {
          if (signal?.aborted === true) {
            reject(new AbortError());
            return;
          }
          const stage = PROCESSING_STAGES[index];
          if (stage === undefined) {
            resolve();
            return;
          }
          const isLast = index === PROCESSING_STAGES.length - 1;
          if (isLast && outcome === "failure") {
            reject(new Error("The document could not be prepared."));
            return;
          }
          onStage(stage, index);
          index += 1;
          if (index >= PROCESSING_STAGES.length) {
            resolve();
            return;
          }
          setTimeout(advance, stageDelayMs);
        };
        if (stageDelayMs <= 0) {
          // Synchronous path for tests: still reports every stage in order.
          try {
            for (const [stageIndex, stage] of PROCESSING_STAGES.entries()) {
              if (signal?.aborted === true) {
                throw new AbortError();
              }
              const isLast = stageIndex === PROCESSING_STAGES.length - 1;
              if (isLast && outcome === "failure") {
                throw new Error("The document could not be prepared.");
              }
              onStage(stage, stageIndex);
            }
            resolve();
          } catch (error) {
            reject(error);
          }
          return;
        }
        setTimeout(advance, stageDelayMs);
      });
    },
  };
}
