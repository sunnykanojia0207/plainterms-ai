"use client";

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { logger } from "@/lib/privacy/log";

interface BoundaryProps {
  readonly children: ReactNode;
  readonly scope: string;
  readonly onReset?: () => void;
}

interface BoundaryState {
  readonly failed: boolean;
}

/**
 * Feature error boundary. Catches render crashes inside one feature,
 * logs a content-free diagnostic, and renders a recoverable state.
 * Stack traces and document content never reach the UI.
 */
class FeatureErrorBoundaryInner extends Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error("Render failure captured by boundary", {
      scope: this.props.scope,
      // Error name only (e.g. TypeError) — never the message, which can
      // echo rendered content. In development, also surface it to assist
      // debugging without involving document data.
      kind: error.name,
      hasComponentStack: info.componentStack === null ? false : true,
    });
    if (process.env.NODE_ENV !== "production") {
      console.error(`[${this.props.scope}] ${error.name}`);
    }
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <ErrorState
          kind="recoverable"
          onRetry={() => {
            this.props.onReset?.();
            this.setState({ failed: false });
          }}
        />
      );
    }
    return this.props.children;
  }
}

/** Feature-level boundary. Name the scope (e.g. "review-panel"). */
export function FeatureErrorBoundary(props: BoundaryProps) {
  return <FeatureErrorBoundaryInner {...props} />;
}
