import { Skeleton } from "@/components/ui/skeleton";

export default function NoiseLoading() {
  return (
    <div className="max-w-3xl">
      <Skeleton className="h-8 w-40 mb-2" />
      <Skeleton className="h-4 w-64 mb-6" />
      <div className="space-y-3 mb-8">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
