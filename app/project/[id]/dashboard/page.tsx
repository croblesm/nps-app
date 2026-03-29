"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { npsLabel } from "@/lib/nps/calculator";
import { Spinner } from "@/components/ui/Spinner";
import { ScoreCards } from "@/components/nps/ScoreCards";
import { CategoryBreakdown } from "@/components/nps/CategoryBreakdown";
import { SearchBar } from "@/components/nps/SearchBar";
import { FilterPanel } from "@/components/nps/FilterPanel";
import { DataTable } from "@/components/nps/DataTable";

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

interface CategoryBreakdownItem {
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
  categoryBreakdown: CategoryBreakdownItem[];
  noiseExcludedCount: number;
  activeNoiseFilterCount: number;
}

export default function DashboardPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [data, setData] = useState<CommentsResponse | null>(null);
  const [nps, setNps] = useState<NpsStats | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsClassification, setNeedsClassification] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classifyResult, setClassifyResult] = useState("");

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
      if (
        result.comments.length > 0 &&
        !result.comments.some((c) => c.categoryName)
      ) {
        setNeedsClassification(true);
      }
    }
    setLoading(false);
  }, [projectId, page, limit, search, feedbackType, categoryFilter, actionableFilter, sortBy, sortDir]);

  const fetchStats = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/stats`);
    if (res.ok) {
      const stats: NpsStats = await res.json();
      setNps(stats);
      setCategoryBreakdown(stats.categoryBreakdown);
    }
  }, [projectId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

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

  function handleFeedbackType(type: string) {
    setFeedbackType(type);
    setPage(1);
  }

  function handleCategoryFilter(cat: string) {
    setCategoryFilter(cat);
    setPage(1);
  }

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleActionableFilter(val: string) {
    setActionableFilter(val);
    setPage(1);
  }

  function handleLimitChange(val: number) {
    setLimit(val);
    setPage(1);
  }

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
        {classifying && (
          <div className="mb-4 p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Spinner size="sm" label="Classifying comments in batches of 25..." />
          </div>
        )}
        <button
          onClick={handleClassify}
          disabled={classifying}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {classifying ? <Spinner size="sm" label="Classifying..." /> : "Classify All Comments"}
        </button>
        {classifyResult && (
          <p className="mt-3 text-sm text-gray-400">{classifyResult}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <ScoreCards
        nps={nps}
        npsLabel={npsLabel(nps.npsScore)}
        feedbackType={feedbackType}
        onFeedbackTypeChange={handleFeedbackType}
      />
      {nps.activeNoiseFilterCount > 0 && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-300">
          {nps.activeNoiseFilterCount} noise filter{nps.activeNoiseFilterCount > 1 ? "s" : ""} applied — {nps.noiseExcludedCount} comment{nps.noiseExcludedCount !== 1 ? "s" : ""} excluded from NPS score
        </div>
      )}
      <CategoryBreakdown
        categories={categoryBreakdown}
        activeCategory={categoryFilter}
        onCategoryChange={handleCategoryFilter}
      />
      <SearchBar value={search} onChange={handleSearch} />
      <FilterPanel
        actionableFilter={actionableFilter}
        onActionableChange={handleActionableFilter}
        limit={limit}
        onLimitChange={handleLimitChange}
        totalResults={data?.total || 0}
      />
      <DataTable
        comments={data?.comments || []}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
        page={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  );
}
