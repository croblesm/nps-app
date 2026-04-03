"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { useAssistantContext } from "@/lib/assistant-context";

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

interface StructureData {
  includedColumns: string[];
  excludedColumns: string[];
}

interface StructureClientProps {
  initialStructure: StructureData | null;
}

export function StructureClient({ initialStructure }: StructureClientProps) {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [columns, setColumns] = useState<ColumnSelection[]>(() => {
    if (!initialStructure) return [];
    return [
      ...initialStructure.includedColumns.map((name) => ({
        name,
        include: true,
        reason: "Previously confirmed",
        type: "",
        isNps: name.toLowerCase().includes("nps"),
        isComment: name.toLowerCase().includes("comment"),
      })),
      ...initialStructure.excludedColumns.map((name) => ({
        name,
        include: false,
        reason: "Previously excluded",
        type: "",
        isNps: false,
        isComment: false,
      })),
    ];
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiIssues, setAiIssues] = useState<string[]>([]);
  const [analyzed, setAnalyzed] = useState(!!initialStructure);
  const { setPageContext } = useAssistantContext();

  useEffect(() => {
    setPageContext({
      columns: columns.map(c => ({ name: c.name, included: c.include })),
    });
  }, [columns, setPageContext]);

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
      <p className="text-muted-foreground mb-6">
        AI will analyze your data and recommend which columns to include
      </p>

      {!analyzed && (
        <>
          {analyzing && (
            <div className="mb-4 p-3 rounded bg-muted border border-border">
              <Spinner size="sm" label="Analyzing data structure with AI..." />
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium"
          >
            {analyzing ? <Spinner size="sm" label="Analyzing with AI..." /> : "Analyze Data Structure"}
          </button>
        </>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg text-sm bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {aiIssues.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-muted border border-border">
          <h3 className="text-sm font-medium text-muted-foreground">
            Data Quality Notes
          </h3>
          <ul className="mt-1 text-sm text-muted-foreground space-y-1">
            {aiIssues.map((issue, i) => (
              <li key={i}>&bull; {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {columns.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Column Recommendations
          </h2>

          {columns.map((col) => (
            <div
              key={col.name}
              className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                col.include
                  ? "bg-card ring-1 ring-primary/30"
                  : "bg-muted border-border opacity-60"
              }`}
              onClick={() => toggleColumn(col.name)}
            >
              <input
                type="checkbox"
                checked={col.include}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleColumn(col.name);
                }}
                className="mt-1 rounded cursor-pointer accent-primary"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {col.name}
                  </span>
                  {col.isNps && (
                    <span className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary">
                      NPS Score
                    </span>
                  )}
                  {col.isComment && (
                    <span className="px-2 py-0.5 text-xs rounded bg-secondary text-secondary-foreground">
                      Comments
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {col.reason}
                </p>
              </div>
            </div>
          ))}

          {saving && (
            <div className="mt-4 p-3 rounded bg-muted border border-border">
              <Spinner size="sm" label="Saving column structure..." />
            </div>
          )}
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium"
          >
            {saving ? <Spinner size="sm" label="Saving..." /> : "Confirm Structure & Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
