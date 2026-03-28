"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Spinner } from "@/components/ui/Spinner";

interface SummaryData {
  id: string;
  markdown: string;
  generatedAt: string;
}

export default function SummaryPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check for existing summary
    fetch(`/api/projects/${projectId}/comments?limit=1`).catch(() => {});
  }, [projectId]);

  async function handleGenerate() {
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (res.ok) {
        setSummary(data);
      } else {
        setError(data.error || "Summary generation failed");
      }
    } catch {
      setError("Failed to generate summary. Check your LLM settings.");
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (!summary) return;
    const blob = new Blob([summary.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nps-summary-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI Summary</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Generate an AI-powered insight report
          </p>
        </div>
        <div className="flex gap-2">
          {summary && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            >
              Download .md
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {generating
              ? <Spinner size="sm" label="Generating..." />
              : summary
              ? "Regenerate"
              : "Generate Summary"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 mb-4">
          {error}
        </div>
      )}

      {generating && (
        <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-4">
          <Spinner size="sm" label="Generating AI-powered insight report..." />
        </div>
      )}

      {summary && !generating && (
        <div className="prose prose-invert max-w-none p-6 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <ReactMarkdown>{summary.markdown}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
