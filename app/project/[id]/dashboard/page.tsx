"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface ClassificationStatus {
  totalComments: number;
  noComment: number;
  classified: number;
  totalToClassify: number;
  errors: string[];
}

export default function DashboardPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [classifying, setClassifying] = useState(false);
  const [status, setStatus] = useState<ClassificationStatus | null>(null);
  const [hasClassified, setHasClassified] = useState(false);
  const [error, setError] = useState("");

  // Check if comments are already classified
  useEffect(() => {
    fetch(`/api/projects/${projectId}/comments?limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data.comments?.some((c: { categoryId: string | null }) => c.categoryId)) {
          setHasClassified(true);
        }
      })
      .catch(() => {});
  }, [projectId]);

  async function handleClassify() {
    setClassifying(true);
    setError("");

    try {
      const res = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        setHasClassified(true);
      } else {
        setError(data.error || "Classification failed");
      }
    } catch {
      setError("Classification failed. Check your LLM settings.");
    } finally {
      setClassifying(false);
    }
  }

  if (!hasClassified) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Classify all comments into your confirmed categories before viewing the dashboard.
        </p>

        <button
          onClick={handleClassify}
          disabled={classifying}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {classifying
            ? "Classifying comments with AI..."
            : "Classify All Comments"}
        </button>

        {classifying && (
          <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Processing comments in batches of 25... This may take a minute.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg text-sm bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {status && (
          <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <h3 className="font-medium text-green-800 dark:text-green-300">
              Classification Complete
            </h3>
            <ul className="mt-2 text-sm text-green-700 dark:text-green-400 space-y-1">
              <li>Total comments: {status.totalComments}</li>
              <li>Classified by AI: {status.classified}</li>
              <li>No comment (flagged): {status.noComment}</li>
              {status.errors.length > 0 && (
                <li className="text-yellow-600">
                  {status.errors.length} batch errors (some comments may be unclassified)
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Dashboard will be built in Task Group 8
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400">
        Comments classified. Dashboard components loading in next implementation phase.
      </p>
    </div>
  );
}
