import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

export const metadata: Metadata = {
  title: "Review",
  description:
    "Read your client contract beside plain-language guidance, with every claim traced to its source clause.",
};

/**
 * Review index — reached when no document is selected. Routes the user to
 * the library instead of rendering an empty workspace.
 */
export default function ReviewIndexPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-10">
      <Heading level={1}>Review</Heading>
      <Text tone="secondary">Choose a document to read it beside plain-language guidance.</Text>
      <EmptyState
        title="No document selected"
        description="Open a contract from your library, or upload one to begin."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="sm" href="/documents">
              Open library
            </Button>
            <Button variant="secondary" size="sm" href="/">
              Upload a document
            </Button>
          </div>
        }
      />
    </div>
  );
}
