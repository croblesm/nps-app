import { Skeleton } from "@/components/ui/skeleton";

export default function UploadLoading() {
  return (
    <div className="max-w-4xl">
      <Skeleton className="h-8 w-40 mb-2" />
      <Skeleton className="h-4 w-64 mb-6" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}
