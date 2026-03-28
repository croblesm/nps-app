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
      <h2 className="text-xl font-bold text-red-500 mb-4">
        Something went wrong
      </h2>
      <p className="text-gray-400 mb-6 text-center max-w-md">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
