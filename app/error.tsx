"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { logger } from "@/lib/privacy/log";

interface RouteErrorProps {
  readonly error: Error;
  readonly reset: () => void;
}

/** Route error boundary. Logs a content-free diagnostic; never shows internals. */
export default function RouteError({ reset }: RouteErrorProps) {
  useEffect(() => {
    // Deliberately content-free: error messages can echo rendered text,
    // which must never enter logs. Actions, not content.
    logger.error("Route failure", { scope: "route-boundary" });
  }, []);

  return (
    <div className="mx-auto max-w-xl py-10">
      <ErrorState kind="recoverable" onRetry={reset} />
    </div>
  );
}
