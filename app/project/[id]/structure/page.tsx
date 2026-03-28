"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface ColumnRecommendation {
  column: string;
  include: boolean;
  reason: string;
}

interface AiValidation {
  npsColumn: string;
  commentColumn: string;
  issues: string[];
  columnRecommendations: ColumnRecommendation[];
}

interface ColumnSelection {
  name: string;
  include: boolean;
  reason: string;
  type: string;
  isNps: boolean;
  isComment: boolean;
}

export default function StructurePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [columns, setColumns] = useState<ColumnSelection[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiIssues, setAiIssues] = useState<string[]>([]);
  const [analyzed, setAnalyzed] = useState(false);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError("");

    try {
      const res = await fetch("/api/ai/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "AI analysis failed");
        return;
      }

      const validation = data as AiValidation;
      setAiIssues(validation.issues);

      setColumns(
        validation.columnRecommendations.map((rec) => ({
          name: rec.column,
          include: rec.include,
          reason: rec.reason,
          type: "",
          isNps: rec.column === validation.npsColumn,
          isComment: rec.column === validation.commentColumn,
        }))
      );
      setAnalyzed(true);
    } catch {
      setError("Failed to run AI analysis. Check your LLM settings.");
    } finally {
      setAnalyzing(false);
    }
  }

  function toggleColumn(name: string) {
    setColumns((prev) =>
      prev.map((c) =>
        c.name === name ? { ...c, include: !c.include } : c
      )
    );
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      const included = columns.filter((c) => c.include).map((c) => c.name);
      const excluded = columns.filter((c) => !c.include).map((c) => c.name);

      const res = await fetch(`/api/projects/${projectId}/structure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includedColumns: included, excludedColumns: excluded }),
      });

      if (res.ok) {
        router.push(`/project/${projectId}/categories`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Report Structure</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        AI will analyze your data and recommend which columns to include
      </p>

      {!analyzed && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {analyzing ? "Analyzing with AI..." : "Analyze Data Structure"}
        </button>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg text-sm bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {aiIssues.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            Data Quality Notes
          </h3>
          <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
            {aiIssues.map((issue, i) => (
              <li key={i}>&bull; {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {columns.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Column Recommendations
          </h2>

          {columns.map((col) => (
            <div
              key={col.name}
              className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                col.include
                  ? "bg-white dark:bg-gray-900 border-green-300 dark:border-green-800"
                  : "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 opacity-60"
              }`}
              onClick={() => toggleColumn(col.name)}
            >
              <input
                type="checkbox"
                checked={col.include}
                onChange={() => toggleColumn(col.name)}
                className="mt-1 rounded"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {col.name}
                  </span>
                  {col.isNps && (
                    <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      NPS Score
                    </span>
                  )}
                  {col.isComment && (
                    <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Comments
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {col.reason}
                </p>
              </div>
            </div>
          ))}

          <button
            onClick={handleConfirm}
            disabled={saving}
            className="mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? "Saving..." : "Confirm Structure & Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
