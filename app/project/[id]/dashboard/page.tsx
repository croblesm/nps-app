"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { npsLabel } from "@/lib/nps/calculator";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScoreCards } from "@/components/nps/ScoreCards";
import { CategoryBreakdown } from "@/components/nps/CategoryBreakdown";
import { SearchBar } from "@/components/nps/SearchBar";
import { FilterPanel } from "@/components/nps/FilterPanel";
import { DataTable } from "@/components/nps/DataTable";
import { ChatPanel } from "@/components/nps/ChatPanel";
import { Progress } from "@/components/ui/progress";
import { Filter, Sparkles, LayoutDashboard, MessageSquare, Zap } from "lucide-react";

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
  const [chatEnabled, setChatEnabled] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState("");
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    if (res.ok) {
      const project = await res.json();
      setChatEnabled(project.chatEnabled || false);
    }
  }, [projectId]);

  const fetchGitHubConfig = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/github`);
    if (res.ok) {
      const config = await res.json();
      setGithubEnabled(!!config?.id);
    }
  }, [projectId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchProject(); }, [fetchProject]);
  useEffect(() => { fetchGitHubConfig(); }, [fetchGitHubConfig]);

  async function handleClassify() {
    setClassifying(true);
    const res = await fetch("/api/ai/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const result = await res.json();
    if (res.ok) {
      toast.success(`Classified ${result.classified} comments`);
      setNeedsClassification(false);
      await fetchComments();
      await fetchStats();
    } else {
      toast.error(result.error || "Classification failed");
    }
    setClassifying(false);
  }

  async function handleEnableChat() {
    setEmbedding(true);
    setEmbeddingProgress("Starting embedding pipeline...");
    try {
      const res = await fetch("/api/ai/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const result = await res.json();
      if (res.ok) {
        if (result.status === "complete") {
          toast.success(`Embedded ${result.embedded} comments. Chat is ready!`);
          setChatEnabled(true);
        } else {
          toast.warning(
            `Partial embedding: ${result.embedded}/${result.totalToEmbed} comments. ${result.errors.length} errors.`
          );
        }
      } else {
        toast.error(result.error || "Embedding failed");
      }
    } catch {
      toast.error("Failed to start embedding pipeline");
    } finally {
      setEmbedding(false);
      setEmbeddingProgress("");
    }
  }

  async function handleExportCategory(categoryName: string, commentCount: number) {
    if (exporting) return;
    setExporting(true);
    try {
      // Fetch top comments for this category
      const commentsRes = await fetch(
        `/api/projects/${projectId}/comments?category=${encodeURIComponent(categoryName)}&limit=5&sortBy=npsScore&sortDir=ASC`
      );
      const commentsData = await commentsRes.json();
      const topComments = (commentsData.comments || [])
        .filter((c: CommentRow) => c.commentText)
        .slice(0, 5)
        .map((c: CommentRow) => ({ text: c.commentText!, nps: c.npsScore ?? 0 }));

      if (topComments.length === 0) {
        toast.error("No comments with text to export in this category");
        return;
      }

      const npsImpact = nps
        ? `NPS Score: ${nps.npsScore} (${nps.promoterPct}% promoters, ${nps.detractorPct}% detractors)`
        : "NPS data unavailable";

      const res = await fetch(`/api/projects/${projectId}/github/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName,
          commentCount,
          npsImpact,
          topComments,
          recommendation: `Review the ${commentCount} comments in the "${categoryName}" category and address the underlying feedback.`,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Created GitHub issue #${result.githubIssueNumber}`);
      } else {
        toast.error(result.error || "Failed to create issue");
      }
    } catch {
      toast.error("Failed to export to GitHub");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportSelected(comments: CommentRow[]) {
    if (exporting) return;
    setExporting(true);
    try {
      const withText = comments.filter((c) => c.commentText);
      if (withText.length === 0) {
        toast.error("No comments with text to export");
        return;
      }

      const categoryName = withText[0].categoryName || "Selected Comments";
      const topComments = withText.slice(0, 10).map((c) => ({
        text: c.commentText!,
        nps: c.npsScore ?? 0,
      }));

      const npsImpact = nps
        ? `NPS Score: ${nps.npsScore} (${nps.promoterPct}% promoters, ${nps.detractorPct}% detractors)`
        : "NPS data unavailable";

      const res = await fetch(`/api/projects/${projectId}/github/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName: comments.length === 1 ? categoryName : "Selected Feedback",
          commentCount: comments.length,
          npsImpact,
          topComments,
          recommendation: `Review these ${comments.length} selected NPS comments and address the feedback.`,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`Created GitHub issue #${result.githubIssueNumber}`);
      } else {
        toast.error(result.error || "Failed to create issue");
      }
    } catch {
      toast.error("Failed to export to GitHub");
    } finally {
      setExporting(false);
    }
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
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (needsClassification) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-blue-500" />
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Comments need to be classified before viewing the dashboard.
          </p>
          {classifying && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Spinner size="sm" label="Classifying comments in batches of 25..." />
            </div>
          )}
          <Button
            onClick={handleClassify}
            disabled={classifying}
            size="lg"
          >
            {classifying ? (
              <Spinner size="sm" label="Classifying..." />
            ) : (
              <>
                <Sparkles className="size-4" />
                Classify All Comments
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ScoreCards
        nps={nps}
        npsLabel={npsLabel(nps.npsScore)}
        feedbackType={feedbackType}
        onFeedbackTypeChange={handleFeedbackType}
      />

      {nps.activeNoiseFilterCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-300">
          <Filter className="size-4 shrink-0" />
          <Badge variant="outline" className="border-yellow-400 text-yellow-700 dark:text-yellow-300">
            {nps.activeNoiseFilterCount} noise filter{nps.activeNoiseFilterCount > 1 ? "s" : ""}
          </Badge>
          <span>
            {nps.noiseExcludedCount} comment{nps.noiseExcludedCount !== 1 ? "s" : ""} excluded from NPS score
          </span>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-base font-medium">
            <LayoutDashboard className="size-4" />
            Category Breakdown
          </div>
          <CategoryBreakdown
            categories={categoryBreakdown}
            activeCategory={categoryFilter}
            onCategoryChange={handleCategoryFilter}
            githubEnabled={githubEnabled}
            onExportToGitHub={handleExportCategory}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
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
            githubEnabled={githubEnabled}
            onExportSelected={handleExportSelected}
          />
        </CardContent>
      </Card>

      {/* Chat Analysis Section */}
      {chatEnabled ? (
        <ChatPanel projectId={projectId} />
      ) : (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-base font-medium">
              <MessageSquare className="size-4" />
              Chat Analysis
            </div>
            <p className="text-sm text-muted-foreground">
              Enable AI-powered chat to ask natural language questions about your NPS data.
              This will generate vector embeddings for all comments.
            </p>
            {embedding && embeddingProgress && (
              <div className="space-y-2">
                <Progress value={null} className="h-2" />
                <p className="text-xs text-muted-foreground">{embeddingProgress}</p>
              </div>
            )}
            <Button
              onClick={handleEnableChat}
              disabled={embedding}
              variant="outline"
            >
              {embedding ? (
                <Spinner size="sm" label="Embedding comments..." />
              ) : (
                <>
                  <Zap className="size-4" />
                  Enable Chat Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
