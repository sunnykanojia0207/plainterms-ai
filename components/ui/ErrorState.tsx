import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

type ErrorKind = "not-found" | "generic" | "recoverable";

const KIND_COPY: Record<ErrorKind, { title: string; description: string }> = {
  "not-found": {
    title: "We couldn't find that",
    description: "The page or document you're looking for doesn't exist or was deleted.",
  },
  generic: {
    title: "Something went wrong",
    description: "An unexpected problem occurred. Your documents are safe — try again.",
  },
  recoverable: {
    title: "This didn't work",
    description: "The action couldn't be completed. Check the details and retry.",
  },
};

interface ErrorStateProps {
  readonly kind?: ErrorKind;
  readonly detail?: string;
  readonly onRetry?: () => void;
  readonly homeHref?: string;
  readonly action?: ReactNode;
}

/**
 * User-friendly error state. Never exposes stack traces or document content.
 * `detail` is a safe, human-written message — never an Error object dump.
 */
export function ErrorState({
  kind = "generic",
  detail,
  onRetry,
  homeHref = "/",
  action,
}: ErrorStateProps) {
  const copy = KIND_COPY[kind];
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-12 text-center"
    >
      <Heading level={2}>{copy.title}</Heading>
      <Text tone="secondary" className="max-w-[50ch] text-center">
        {detail ?? copy.description}
      </Text>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {onRetry === undefined ? null : (
          <Button variant="primary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
        {action}
        <Button variant="secondary" size="sm" href={homeHref}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
