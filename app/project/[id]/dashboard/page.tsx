"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { npsEmoji } from "@/lib/nps/calculator";

interface CommentRow {
  id: string;
  rowIndex: number;
  npsScore: number | null;
  commentText: string | null;
  categoryName: string | null;
  isActionable: boolean;
  isNoise: boolean;
  hasComment: boolean;
  aiConfidence: number | null;
  aiReasoning: string | null;
  metadata: Record<string, unknown> | null;
}

interface CommentsResponse {
  comments: CommentRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CategoryBreakdown {
  name: string;
  count: number;
  percentage: number;
}

interface NpsStats {
  total: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  categoryBreakdown: CategoryBreakdown[];
}

export default function DashboardPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [data, setData] = useState<CommentsResponse | null>(null);
  const [nps, setNps] = useState<NpsStats | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsClassification, setNeedsClassification] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classifyResult, setClassifyResult] = useState<string>("");

  // Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [actionableFilter, setActionableFilter] = useState("");
  const [sortBy, setSortBy] = useState("rowIndex");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  const fetchComments = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortDir,
    });
    if (search) params.set("search", search);
    if (feedbackType) params.set("feedbackType", feedbackType);
    if (categoryFilter) params.set("category", categoryFilter);
    if (actionableFilter) params.set("actionable", actionableFilter);

    const res = await fetch(`/api/projects/${projectId}/comments?${params}`);
    if (res.ok) {
      const result: CommentsResponse = await res.json();
      setData(result);

      if (result.comments.length > 0 && !result.comments.some((c) => c.categoryName)) {
        setNeedsClassification(true);
      }
    }
    setLoading(false);
  }, [projectId, page, limit, search, feedbackType, categoryFilter, actionableFilter, sortBy, sortDir]);

  // Server-side aggregation for NPS stats and category breakdown
  const fetchStats = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/stats`);
    if (res.ok) {
      const stats: NpsStats = await res.json();
      setNps(stats);
      setCategoryBreakdown(stats.categoryBreakdown);
    }
  }, [projectId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleClassify() {
    setClassifying(true);
    const res = await fetch("/api/ai/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const result = await res.json();
    if (res.ok) {
      setClassifyResult(`Classified ${result.classified} comments`);
      setNeedsClassification(false);
      await fetchComments();
      await fetchStats();
    } else {
      setClassifyResult(result.error || "Classification failed");
    }
    setClassifying(false);
  }

  function handleSort(col: string) {
    if (sortBy === col) {
      setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(col);
      setSortDir("ASC");
    }
    setPage(1);
  }

  const npsLabel = nps ? npsEmoji(nps.npsScore) : "";

  if (loading || !nps) {
    return <div className="text-gray-400 p-8">Loading dashboard...</div>;
  }

  if (needsClassification) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Comments need to be classified before viewing the dashboard.
        </p>
        <button
          onClick={handleClassify}
          disabled={classifying}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {classifying ? "Classifying..." : "Classify All Comments"}
        </button>
        {classifyResult && (
          <p className="mt-3 text-sm text-gray-400">{classifyResult}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <button
          onClick={() => { setFeedbackType(""); setPage(1); }}
          className={`p-4 rounded-lg text-left transition-colors ${
            !feedbackType
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500"
          }`}
        >
          <div className="text-xs uppercase tracking-wide opacity-70">Total Responses</div>
          <div className="text-2xl font-bold mt-1">{nps.total}</div>
        </button>
        <button
          onClick={() => { setFeedbackType(feedbackType === "promoter" ? "" : "promoter"); setPage(1); }}
          className={`p-4 rounded-lg text-left transition-colors ${
            feedbackType === "promoter"
              ? "bg-green-600 text-white"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-green-500"
          }`}
        >
          <div className="text-xs uppercase tracking-wide opacity-70">Promoters (9-10)</div>
          <div className="text-2xl font-bold mt-1">{nps.promoters}</div>
          <div className="text-xs opacity-70">{nps.promoterPct}%</div>
        </button>
        <button
          onClick={() => { setFeedbackType(feedbackType === "passive" ? "" : "passive"); setPage(1); }}
          className={`p-4 rounded-lg text-left transition-colors ${
            feedbackType === "passive"
              ? "bg-yellow-600 text-white"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-yellow-500"
          }`}
        >
          <div className="text-xs uppercase tracking-wide opacity-70">Passives (7-8)</div>
          <div className="text-2xl font-bold mt-1">{nps.passives}</div>
          <div className="text-xs opacity-70">{nps.passivePct}%</div>
        </button>
        <button
          onClick={() => { setFeedbackType(feedbackType === "detractor" ? "" : "detractor"); setPage(1); }}
          className={`p-4 rounded-lg text-left transition-colors ${
            feedbackType === "detractor"
              ? "bg-red-600 text-white"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-500"
          }`}
        >
          <div className="text-xs uppercase tracking-wide opacity-70">Detractors (0-6)</div>
          <div className="text-2xl font-bold mt-1">{nps.detractors}</div>
          <div className="text-xs opacity-70">{nps.detractorPct}%</div>
        </button>
        <div className="p-4 rounded-lg bg-purple-600 text-white">
          <div className="text-xs uppercase tracking-wide opacity-70">NPS Score</div>
          <div className="text-2xl font-bold mt-1">{nps.npsScore}</div>
          <div className="text-xs opacity-70">{npsLabel}</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {categoryBreakdown.map((cat) => (
          <button
            key={cat.name}
            onClick={() => {
              setCategoryFilter(categoryFilter === cat.name ? "" : cat.name);
              setPage(1);
            }}
            className={`p-3 rounded-lg text-left text-sm transition-colors ${
              categoryFilter === cat.name
                ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500 border"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-400"
            }`}
          >
            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {cat.name}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              {cat.count} ({cat.percentage}%)
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search comments..."
        className="w-full p-2 mb-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
      />

      {/* Filters Row */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={actionableFilter}
          onChange={(e) => { setActionableFilter(e.target.value); setPage(1); }}
          className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        >
          <option value="">All Comments</option>
          <option value="true">Actionable</option>
          <option value="false">Non-Actionable</option>
        </select>
        <select
          value={limit}
          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
        <span className="text-sm text-gray-400 self-center">
          {data ? `${data.total} results` : ""}
        </span>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {[
                { key: "npsScore", label: "NPS" },
                { key: "category", label: "Category" },
                { key: "rowIndex", label: "Comment" },
                { key: "aiConfidence", label: "Confidence" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500 select-none"
                >
                  {col.label}
                  {sortBy === col.key && (
                    <span className="ml-1">{sortDir === "ASC" ? "\u2191" : "\u2193"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.comments.map((row) => (
              <tr
                key={row.id}
                className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
              >
                <td className="px-3 py-2">
                  {row.npsScore !== null && (
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold text-white ${
                        row.npsScore >= 9
                          ? "bg-green-600"
                          : row.npsScore >= 7
                          ? "bg-yellow-500"
                          : "bg-red-600"
                      }`}
                    >
                      {row.npsScore}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  <span className="truncate block max-w-[150px]">
                    {row.categoryName || "—"}
                  </span>
                  {!row.isActionable && row.hasComment && (
                    <span className="text-xs text-red-400">Non-actionable</span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100 max-w-md">
                  <span
                    className="block truncate"
                    title={row.commentText || ""}
                  >
                    {row.commentText || (
                      <span className="text-gray-400 italic">No comment</span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-400 text-xs">
                  {row.aiConfidence !== null
                    ? `${Math.round(row.aiConfidence * 100)}%`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="px-3 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
