import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { DocumentsLibrary, LibraryHint } from "@/components/documents/DocumentsLibrary";

export const metadata: Metadata = {
  title: "Documents",
  description: "Your contract library — recent, in review, compared, archived.",
};

/** Documents library: real store-backed groups and row actions. */
export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Heading level={1}>Documents</Heading>
          <Text tone="secondary">
            Your contracts live here — recent, in review, compared, archived.
          </Text>
        </div>
        <Button variant="secondary" href="/">
          Upload a document
        </Button>
      </div>
      <LibraryHint />
      <DocumentsLibrary />
    </div>
  );
}
