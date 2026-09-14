import { cn } from "@/lib/utils/cn";

/** Quiet section divider. */
export function Divider({ className }: { readonly className?: string }) {
  return <hr className={cn("border-0 border-t border-border", className)} />;
}
