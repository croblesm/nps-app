"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface NoiseFilterData {
  id: string;
  name: string;
  description: string | null;
  filterKeywords: string;
  excludeFromNps: boolean;
  isActive: boolean;
}

export default function NoisePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [filters, setFilters] = useState<NoiseFilterData[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [excludeFromNps, setExcludeFromNps] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matchPreview, setMatchPreview] = useState<number | null>(null);

  useEffect(() => {
    fetchFilters();
  }, [projectId]);

  async function fetchFilters() {
    const res = await fetch(`/api/projects/${projectId}/noise`);
    if (res.ok) setFilters(await res.json());
  }

  async function previewMatches() {
    const kws = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    if (kws.length === 0) return;

    const res = await fetch(
      `/api/projects/${projectId}/comments?limit=10000`
    );
    if (res.ok) {
      const data = await res.json();
      const lower = kws.map((k) => k.toLowerCase());
      const matches = data.comments.filter(
        (c: { commentText: string | null }) =>
          c.commentText &&
          lower.some((kw) => c.commentText!.toLowerCase().includes(kw))
      );
      setMatchPreview(matches.length);
    }
  }

  async function handleCreate() {
    const kws = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    if (!name.trim() || kws.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/noise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          filterKeywords: kws,
          excludeFromNps,
        }),
      });
      if (res.ok) {
        setName("");
        setDescription("");
        setKeywords("");
        setMatchPreview(null);
        await fetchFilters();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(filterId: string) {
    if (!confirm("Delete this noise filter?")) return;
    await fetch(
      `/api/projects/${projectId}/noise?filterId=${filterId}`,
      { method: "DELETE" }
    );
    await fetchFilters();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Noise Filters</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Filter out noisy comments that skew your NPS score
      </p>

      {/* Existing filters */}
      {filters.length > 0 && (
        <div className="mb-8 space-y-2">
          {filters.map((f) => {
            const kws: string[] = JSON.parse(f.filterKeywords || "[]");
            return (
              <div
                key={f.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {f.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Keywords: {kws.join(", ")}
                  </div>
                  {f.excludeFromNps && (
                    <span className="text-xs text-red-400">
                      Excluded from NPS score
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="text-sm text-gray-400 hover:text-red-500"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create new filter */}
      <div className="space-y-4 p-6 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          New Noise Filter
        </h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Filter name (e.g., ADS/SSMS Comparisons)"
          className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        />
        <div>
          <input
            value={keywords}
            onChange={(e) => { setKeywords(e.target.value); setMatchPreview(null); }}
            placeholder="Keywords, comma-separated (e.g., ADS, SSMS, Azure Data Studio)"
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          />
          <button
            onClick={previewMatches}
            disabled={!keywords.trim()}
            className="mt-1 text-xs text-blue-500 hover:text-blue-400 disabled:opacity-50"
          >
            Preview matches
          </button>
          {matchPreview !== null && (
            <span className="ml-2 text-xs text-gray-400">
              {matchPreview} comments match
            </span>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={excludeFromNps}
            onChange={(e) => setExcludeFromNps(e.target.checked)}
            className="rounded"
          />
          Exclude matching comments from NPS score calculation
        </label>

        <button
          onClick={handleCreate}
          disabled={saving || !name.trim() || !keywords.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {saving ? "Creating..." : "Create Filter"}
        </button>
      </div>
    </div>
  );
}
