import type { Metadata } from "next";
import { Suspense } from "react";
import { AskWorkspace } from "@/components/documents/AskWorkspace";
import { FeatureErrorBoundary } from "@/components/errors/error-boundary";

export const metadata: Metadata = {
  title: "Ask",
  description:
    "Ask what your document says. Every answer cites its evidence — or says honestly when it can't.",
};

/** Ask workspace: document-scoped Q&A, never a generic chatbot. */
export default function AskPage() {
  return (
    <FeatureErrorBoundary scope="ask-workspace">
      <Suspense>
        <AskWorkspace />
      </Suspense>
    </FeatureErrorBoundary>
  );
}
