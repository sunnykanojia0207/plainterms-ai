import type { Metadata } from "next";
import { ReviewWorkspace } from "@/components/documents/ReviewWorkspace";

export const metadata: Metadata = {
  title: "Review",
  description:
    "Read a contract beside plain-language guidance, with every claim linked to its source.",
};

interface ReviewPageProps {
  readonly params: Promise<{ readonly documentId: string }>;
}

/** Review workspace populated from the document store (fixture-backed). */
export default async function ReviewPage({ params }: ReviewPageProps) {
  const { documentId } = await params;
  return <ReviewWorkspace documentId={documentId} />;
}
