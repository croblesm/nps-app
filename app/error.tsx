"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
      <h2 className="text-xl font-bold text-destructive mb-4">
        Something went wrong
      </h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
