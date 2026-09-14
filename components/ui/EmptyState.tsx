import type { ReactNode } from "react";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";

interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}

/** Calm empty state: orientation + one action. Never decorative illustration noise. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
      <Heading level={2}>{title}</Heading>
      <Text tone="secondary" className="max-w-[50ch] text-center">
        {description}
      </Text>
      {action === undefined ? null : <div className="mt-2">{action}</div>}
    </div>
  );
}
