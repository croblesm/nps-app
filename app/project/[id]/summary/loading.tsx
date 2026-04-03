import { Skeleton } from "@/components/ui/skeleton";

export default function SummaryLoading() {
  return (
    <div className="max-w-4xl space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
