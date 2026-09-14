import { cn } from "@/lib/utils/cn";

/** Base shimmer block. Shape comes from the caller's layout classes. */
export function Skeleton({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-muted", className)}
    />
  );
}

function Lines({ count }: { readonly count: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={cn("h-4", index === count - 1 && "w-2/3")} />
      ))}
    </div>
  );
}

/** Full-page loading shape: title + content rows. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
      <Lines count={4} />
    </div>
  );
}

/** Workspace side-panel loading shape. */
export function PanelSkeleton() {
  return (
    <div role="status" aria-label="Loading panel" className="flex flex-col gap-4">
      <Skeleton className="h-6 w-40" />
      <Lines count={3} />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

/** Legal-document viewer loading shape: page-like block with long lines. */
export function DocumentSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading document"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 sm:p-10"
    >
      <Skeleton className="mx-auto h-6 w-1/2" />
      <div className="h-6" />
      <Lines count={12} />
    </div>
  );
}

/** AI answer loading shape: marker row + streaming-like lines. */
export function AISkeleton() {
  return (
    <div role="status" aria-label="Gemini is reviewing" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Lines count={3} />
    </div>
  );
}

/** Document-list loading shape. */
export function ListSkeleton({ rows = 3 }: { readonly rows?: number }) {
  return (
    <div role="status" aria-label="Loading list" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <Skeleton className="size-10 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Comparison-table loading shape. */
export function TableSkeleton({ rows = 4 }: { readonly rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading comparison"
      className="overflow-hidden rounded-lg border border-border"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-2 gap-4 border-b border-border p-4 last:border-b-0"
        >
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ))}
    </div>
  );
}
