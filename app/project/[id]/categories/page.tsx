"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface SampleComment {
  index: number;
  text: string;
  nps: number | null;
}

interface ProposedCategory {
  name: string;
  description: string;
  sampleComments: SampleComment[];
  sampleIndices: number[];
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
  const [newCatName, setNewCatName] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  async function handleDiscover() {
    setDiscovering(true);
    setError("");

    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Category discovery failed");
        return;
      }

      const proposed: ProposedCategory[] = data.categories;
      setStats({
        sampleSize: data.sampleSize,
        totalComments: data.totalComments,
      });

      // Convert to editable + add General Feedback fallback
      const editable: EditableCategory[] = [
        ...proposed.map((c) => ({
          name: c.name,
          description: c.description,
          sampleComments: c.sampleComments,
          isFallback: false,
          removed: false,
        })),
        {
          name: "General Feedback",
          description:
            "Comments that do not clearly fit any other category",
          sampleComments: [],
          isFallback: true,
          removed: false,
        },
      ];

      setCategories(editable);
      setDiscovered(true);
    } catch {
      setError("Failed to run AI discovery. Check your LLM settings.");
    } finally {
      setDiscovering(false);
    }
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

  function handleAddCustom() {
    if (!newCatName.trim()) return;
    setCategories((prev) => [
      ...prev.filter((c) => !c.isFallback),
      {
        name: newCatName.trim(),
        description: "Custom category",
        sampleComments: [],
        isFallback: false,
        removed: false,
      },
      ...prev.filter((c) => c.isFallback),
    ]);
    setNewCatName("");
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

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Categories</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        AI will analyze your comments and propose thematic categories
      </p>

      {!discovered && (
        <button
          onClick={handleDiscover}
          disabled={discovering}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {discovering
            ? "Discovering themes with AI..."
            : "Discover Categories"}
        </button>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg text-sm bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {discovered && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analyzed {stats.sampleSize} of {stats.totalComments} comments.{" "}
            {activeCount} categories active.
          </p>

          {categories.map((cat, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border transition-opacity ${
                cat.removed
                  ? "opacity-40 border-gray-300 dark:border-gray-700"
                  : cat.isFallback
                  ? "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
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
                      className="text-lg font-semibold bg-transparent border-b border-blue-500 outline-none text-gray-900 dark:text-gray-100 w-full"
                    />
                  ) : (
                    <h3
                      className="text-lg font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-500"
                      onClick={() => !cat.isFallback && setEditingIdx(idx)}
                      title={cat.isFallback ? "" : "Click to rename"}
                    >
                      {cat.name}
                      {cat.isFallback && (
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          (required fallback)
                        </span>
                      )}
                    </h3>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {cat.description}
                  </p>
                </div>

                {!cat.isFallback && (
                  <button
                    onClick={() =>
                      cat.removed ? handleRestore(idx) : handleRemove(idx)
                    }
                    className="ml-3 text-sm text-gray-400 hover:text-red-500"
                  >
                    {cat.removed ? "Restore" : "Remove"}
                  </button>
                )}
              </div>

              {/* Sample comments */}
              {cat.sampleComments.length > 0 && !cat.removed && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Sample comments
                  </p>
                  {cat.sampleComments.slice(0, 3).map((sc, i) => (
                    <div
                      key={i}
                      className="text-sm text-gray-600 dark:text-gray-400 pl-3 border-l-2 border-gray-200 dark:border-gray-700"
                    >
                      <span className="text-xs text-gray-400 mr-1">
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

          {/* Add custom category */}
          <div className="flex gap-2 mt-4">
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Add custom category..."
              onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
              className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            />
            <button
              onClick={handleAddCustom}
              disabled={!newCatName.trim()}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-sm"
            >
              Add
            </button>
          </div>

          <button
            onClick={handleConfirm}
            disabled={saving || activeCount < 2}
            className="mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving
              ? "Saving..."
              : `Confirm ${activeCount} Categories & Continue`}
          </button>
        </div>
      )}
    </div>
  );
}
