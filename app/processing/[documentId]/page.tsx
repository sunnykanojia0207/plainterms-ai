import type { Metadata } from "next";
import { ProcessingView } from "@/components/documents/ProcessingView";
import type { ProcessingOutcome } from "@/lib/documents/processing";

export const metadata: Metadata = {
  title: "Preparing document",
  description: "Getting your contract ready to read.",
};

interface ProcessingPageProps {
  readonly params: Promise<{ readonly documentId: string }>;
  readonly searchParams: Promise<{ readonly outcome?: string }>;
}

/**
 * Processing step. `?outcome=fail` deterministically exercises the failure
 * path (demo and test harness); the default journey always succeeds.
 */
export default async function ProcessingPage({ params, searchParams }: ProcessingPageProps) {
  const { documentId } = await params;
  const { outcome } = await searchParams;
  const initialOutcome: ProcessingOutcome = outcome === "fail" ? "failure" : "success";
  return <ProcessingView documentId={documentId} initialOutcome={initialOutcome} />;
}
