import type { Metadata } from "next";
import { CompareWorkspace } from "@/components/documents/CompareWorkspace";
import { FeatureErrorBoundary } from "@/components/errors/error-boundary";

export const metadata: Metadata = {
  title: "Compare",
  description: "Compare two versions of a contract and see what changed, in plain language.",
};

/** Compare workspace: setup, semantic redlines, silence findings. */
export default function ComparePage() {
  return (
    <FeatureErrorBoundary scope="compare-workspace">
      <CompareWorkspace />
    </FeatureErrorBoundary>
  );
}
