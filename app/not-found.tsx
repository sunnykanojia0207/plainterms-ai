import type { Metadata } from "next";
import { ErrorState } from "@/components/ui/ErrorState";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <ErrorState kind="not-found" />
    </div>
  );
}
