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
    <div className="mx-auto flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-evidence text-xs font-semibold tracking-widest text-tertiary uppercase">
            Library
          </p>
          <Heading level={1}>Documents</Heading>
          <Text tone="secondary" className="text-sm">
            Recent, in review, compared, archived.
          </Text>
        </div>
        <Button href="/#home-upload">Upload a document</Button>
      </div>
      <LibraryHint />
      <DocumentsLibrary />
    </div>
  );
}
