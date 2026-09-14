import type { Metadata } from "next";
import { ReadyView } from "@/components/documents/ReadyView";

export const metadata: Metadata = {
  title: "Document ready",
  description: "Your contract is ready to review.",
};

interface ReadyPageProps {
  readonly params: Promise<{ readonly documentId: string }>;
}

export default async function ReadyPage({ params }: ReadyPageProps) {
  const { documentId } = await params;
  return <ReadyView documentId={documentId} />;
}
