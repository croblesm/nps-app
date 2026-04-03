import { Skeleton } from "@/components/ui/skeleton";

export default function GitHubLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
