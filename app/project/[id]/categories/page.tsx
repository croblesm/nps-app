"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/skeleton";

interface SampleComment {
  index: number;
  text: string;
  nps: number | null;
}

interface EditableCategory {
  name: string;
  description: string;
  sampleComments: SampleComment[];
  isFallback: boolean;
  removed: boolean;
}

export default function CategoriesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [categories, setCategories] = useState<EditableCategory[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [discovered, setDiscovered] = useState(false);
  const [stats, setStats] = useState({ sampleSize: 0, totalComments: 0 });
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Enhanced add category
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    isValid: boolean;
    matchCount: number;
    refinedDescription: string;
    sampleComments: SampleComment[];
  } | null>(null);

  // Suggest more
  const [suggesting, setSuggesting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing categories from DB on mount
  useEffect(() => {
    fetch(`/api/projects/${projectId}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(
            data.map((cat: { name: string; description: string | null; sampleComments: string | null; isFallback: boolean }) => ({
              name: cat.name,
              description: cat.description || "",
              sampleComments: cat.sampleComments ? JSON.parse(cat.sampleComments) : [],
              isFallback: cat.isFallback,
              removed: false,
            }))
          );
          setDiscovered(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleDiscover() {
    setDiscovering(true);
    setError("");

    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, action: "discover" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Category discovery failed");
        return;
      }

      setStats({
        sampleSize: data.sampleSize,
        totalComments: data.totalComments,
      });

      const aiCategories = (data.categories || []).filter(
        (c: { name: string }) =>
          c.name.toLowerCase() !== "general feedback"
      );

      setCategories([
        ...aiCategories.map((c: { name: string; description: string; sampleComments: SampleComment[] }) => ({
          name: c.name,
          description: c.description,
          sampleComments: c.sampleComments || [],
          isFallback: false,
          removed: false,
        })),
        {
          name: "General Feedback",
          description: "Comments that do not clearly fit any other category",
          sampleComments: [],
          isFallback: true,
          removed: false,
        },
      ]);
      setDiscovered(true);
    } catch {
      setError("Failed to run AI discovery. Check your LLM settings.");
    } finally {
      setDiscovering(false);
    }
  }

  async function handleSuggestMore() {
    setSuggesting(true);
    setError("");

    try {
      const existingNames = categories
        .filter((c) => !c.removed)
        .map((c) => c.name);

      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          action: "suggest-more",
          existingCategories: existingNames,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Suggest more failed");
        return;
      }

      const newCats: EditableCategory[] = (data.categories || [])
        .filter(
          (c: { name: string }) =>
            c.name.toLowerCase() !== "general feedback"
        )
        .map((c: { name: string; description: string; sampleComments: SampleComment[] }) => ({
          name: c.name,
          description: c.description,
          sampleComments: c.sampleComments || [],
          isFallback: false,
          removed: false,
        }));

      // Insert before General Feedback
      setCategories((prev) => [
        ...prev.filter((c) => !c.isFallback),
        ...newCats,
        ...prev.filter((c) => c.isFallback),
      ]);
    } catch {
      setError("Failed to get suggestions. Check your LLM settings.");
    } finally {
      setSuggesting(false);
    }
  }

  async function handleScanTheme() {
    if (!newCatName.trim()) return;
    setScanning(true);
    setScanResult(null);

    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          action: "scan-for-theme",
          themeName: newCatName.trim(),
          themeDescription: newCatDesc.trim() || newCatName.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setScanResult(data);
      }
    } catch {
      setError("AI scan failed");
    } finally {
      setScanning(false);
    }
  }

  function handleAddCustom() {
    if (!newCatName.trim()) return;
    const desc =
      scanResult?.refinedDescription || newCatDesc.trim() || "Custom category";
    const samples = scanResult?.sampleComments || [];

    setCategories((prev) => [
      ...prev.filter((c) => !c.isFallback),
      {
        name: newCatName.trim(),
        description: desc,
        sampleComments: samples,
        isFallback: false,
        removed: false,
      },
      ...prev.filter((c) => c.isFallback),
    ]);
    setNewCatName("");
    setNewCatDesc("");
    setScanResult(null);
  }

  function handleRename(idx: number, name: string) {
    setCategories((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, name } : c))
    );
  }

  function handleRemove(idx: number) {
    if (categories[idx].isFallback) return;
    setCategories((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, removed: true } : c))
    );
  }

  function handleRestore(idx: number) {
    setCategories((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, removed: false } : c))
    );
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      const active = categories.filter((c) => !c.removed);
      const res = await fetch(`/api/projects/${projectId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: active.map((c) => ({
            name: c.name,
            description: c.description,
            sampleComments: c.sampleComments,
            isFallback: c.isFallback,
          })),
        }),
      });

      if (res.ok) {
        router.push(`/project/${projectId}/dashboard`);
      }
    } finally {
      setSaving(false);
    }
  }

  const activeCount = categories.filter((c) => !c.removed).length;

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Categories</h1>
      <p className="text-muted-foreground mb-6">
        AI will analyze your comments and propose thematic categories
      </p>

      {/* Discover / Re-discover */}
      {!discovered ? (
        <>
          {discovering && (
            <div className="mb-4 p-3 rounded bg-muted border border-border">
              <Spinner
                size="sm"
                label="Discovering thematic categories from your comments with AI..."
              />
            </div>
          )}
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium"
          >
            {discovering ? (
              <Spinner size="sm" label="Discovering..." />
            ) : (
              "Discover Categories"
            )}
          </button>
        </>
      ) : (
        <div className="flex items-center gap-4 mb-4">
          <p className="text-sm text-muted-foreground">
            Analyzed {stats.sampleSize} of {stats.totalComments} comments.{" "}
            {activeCount} categories active.
          </p>
          <button
            onClick={() => {
              if (
                confirm(
                  "Re-discover will replace all current categories. Continue?"
                )
              ) {
                setDiscovered(false);
                setCategories([]);
                handleDiscover();
              }
            }}
            className="text-xs text-primary hover:text-primary/80"
          >
            Re-discover
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      {/* Category list */}
      {discovered && (
        <div className="space-y-4">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border transition-opacity ${
                cat.removed
                  ? "opacity-40 border-border"
                  : cat.isFallback
                  ? "border-border bg-muted"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingIdx === idx ? (
                    <input
                      autoFocus
                      value={cat.name}
                      onChange={(e) => handleRename(idx, e.target.value)}
                      onBlur={() => setEditingIdx(null)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setEditingIdx(null)
                      }
                      className="text-lg font-semibold bg-transparent border-b border-primary outline-none text-foreground w-full"
                    />
                  ) : (
                    <h3
                      className={`text-lg font-semibold text-foreground ${
                        !cat.isFallback
                          ? "cursor-pointer hover:text-primary group"
                          : ""
                      }`}
                      onClick={() =>
                        !cat.isFallback && setEditingIdx(idx)
                      }
                    >
                      {cat.name}
                      {cat.isFallback ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (required fallback)
                        </span>
                      ) : (
                        <span className="ml-2 text-xs font-normal text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          click to rename
                        </span>
                      )}
                    </h3>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {cat.description}
                  </p>
                </div>

                {!cat.isFallback && (
                  <button
                    onClick={() =>
                      cat.removed
                        ? handleRestore(idx)
                        : handleRemove(idx)
                    }
                    className="ml-3 text-sm text-muted-foreground hover:text-destructive"
                  >
                    {cat.removed ? "Restore" : "Remove"}
                  </button>
                )}
              </div>

              {cat.sampleComments.length > 0 && !cat.removed && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Sample comments
                  </p>
                  {cat.sampleComments.slice(0, 3).map((sc, i) => (
                    <div
                      key={i}
                      className="text-sm text-muted-foreground pl-3 border-l-2 border-border"
                    >
                      <span className="text-xs text-muted-foreground mr-1">
                        NPS {sc.nps ?? "?"}
                      </span>
                      {sc.text.length > 150
                        ? sc.text.slice(0, 150) + "..."
                        : sc.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Suggest More */}
          <div className="flex items-center gap-2">
            {suggesting && (
              <Spinner size="sm" label="Asking AI for more themes..." />
            )}
            {!suggesting && (
              <button
                onClick={handleSuggestMore}
                className="text-sm text-primary hover:text-primary/80"
              >
                Suggest More Categories
              </button>
            )}
          </div>

          {/* Add Custom Category — Enhanced */}
          <div className="p-4 rounded-lg border border-dashed border-border space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Add Custom Category
            </p>
            <input
              value={newCatName}
              onChange={(e) => {
                setNewCatName(e.target.value);
                setScanResult(null);
              }}
              placeholder="Category name (e.g., Competitor Comparisons)"
              className="w-full p-2 rounded-lg border border-border bg-card text-foreground text-sm"
            />
            <input
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              placeholder="Description (e.g., Comments comparing to SSMS or Azure Data Studio)"
              className="w-full p-2 rounded-lg border border-border bg-card text-foreground text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleScanTheme}
                disabled={scanning || !newCatName.trim()}
                className="px-3 py-1.5 rounded bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50 text-sm"
              >
                {scanning ? (
                  <Spinner size="sm" label="Scanning..." />
                ) : (
                  "AI Scan"
                )}
              </button>
              <button
                onClick={handleAddCustom}
                disabled={!newCatName.trim()}
                className="px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm"
              >
                Add Category
              </button>
            </div>

            {/* Scan results */}
            {scanResult && (
              <div
                className={`p-3 rounded text-sm ${
                  scanResult.isValid
                    ? "bg-muted border border-border text-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="font-medium">
                  {scanResult.isValid
                    ? `Found ${scanResult.matchCount} matching comments`
                    : `Only ${scanResult.matchCount} comments match — may not be a strong category`}
                </p>
                <p className="mt-1 text-xs opacity-80">
                  {scanResult.refinedDescription}
                </p>
                {scanResult.sampleComments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {scanResult.sampleComments.slice(0, 3).map((sc, i) => (
                      <div
                        key={i}
                        className="pl-2 border-l-2 border-current opacity-70 text-xs"
                      >
                        NPS {sc.nps ?? "?"} — {sc.text.slice(0, 120)}
                        {sc.text.length > 120 ? "..." : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm */}
          {saving && (
            <div className="p-3 rounded bg-muted border border-border">
              <Spinner size="sm" label="Saving categories..." />
            </div>
          )}
          <button
            onClick={handleConfirm}
            disabled={saving || activeCount < 2}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium"
          >
            {saving ? (
              <Spinner size="sm" label="Saving..." />
            ) : (
              `Confirm ${activeCount} Categories & Continue`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
