import { PageSkeleton } from "@/components/ui/Skeleton";

/** Route loading state — skeleton shaped like the coming content. */
export default function RootLoading() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <PageSkeleton />
    </div>
  );
}
