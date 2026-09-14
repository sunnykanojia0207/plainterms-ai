import { ErrorState } from "@/components/ui/ErrorState";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <ErrorState kind="not-found" />
    </div>
  );
}
