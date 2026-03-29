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
import { Filter, Sparkles, LayoutDashboard, MessageSquare, X, Loader2 } from "lucide-react";
import { useAssistantContext } from "@/lib/assistant-context";

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
  const [chatOpen, setChatOpen] = useState(false);
  const [partialEmbedding, setPartialEmbedding] = useState<{ embedded: number; total: number } | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
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
    if (categoryFilters.length) params.set("category", categoryFilters.join(","));
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
  }, [projectId, page, limit, search, feedbackType, categoryFilters, actionableFilter, sortBy, sortDir]);

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
      // Check for partial embeddings if chat is not enabled
      if (!project.chatEnabled && project.embeddingProvider) {
        const commentsRes = await fetch(`/api/projects/${projectId}/comments?limit=1`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          if (commentsData.total > 0) {
            // Count embedded vs total by checking if any have embeddings
            setPartialEmbedding({ embedded: 0, total: commentsData.total });
          }
        }
      }
    }
  }, [projectId]);

  const fetchGitHubConfig = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/github`);
    if (res.ok) {
      const config = await res.json();
      setGithubEnabled(!!config?.id);
    }
  }, [projectId]);

  const { setPageContext } = useAssistantContext();

  useEffect(() => { fetchComments(); }, [fetchComments]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchProject(); }, [fetchProject]);
  useEffect(() => { fetchGitHubConfig(); }, [fetchGitHubConfig]);

  useEffect(() => {
    setPageContext({
      npsScore: nps?.npsScore,
      totalResponses: nps?.total,
      promoterPct: nps?.promoterPct,
      passivePct: nps?.passivePct,
      detractorPct: nps?.detractorPct,
      categoryBreakdown: categoryBreakdown,
      activeFilters: { feedbackType, categories: categoryFilters, search },
    });
  }, [nps, categoryBreakdown, feedbackType, categoryFilters, search, setPageContext]);

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

      // Check for non-stream error responses (400s return JSON)
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream")) {
        const result = await res.json();
        if (result.code === "NO_EMBEDDING_PROVIDER" || result.code === "MISSING_EMBEDDING_MODEL") {
          toast.error(result.error, {
            action: {
              label: "Open Settings",
              onClick: () => window.location.assign("/settings"),
            },
            duration: 8000,
          });
        } else {
          toast.error(result.error || "Embedding failed");
        }
        return;
      }

      // Consume SSE stream for progress updates
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === "progress") {
              setEmbeddingProgress(data.step);
            } else if (currentEvent === "complete") {
              if (data.status === "complete") {
                toast.success(`Embedded ${data.embedded} comments. Chat is ready!`);
                setChatEnabled(true);
                setChatOpen(true);
              } else {
                toast.warning(
                  `Partial embedding: ${data.embedded}/${data.totalToEmbed} comments. ${data.errors?.length || 0} errors.`
                );
              }
            } else if (currentEvent === "error") {
              if (data.code === "MISSING_EMBEDDING_MODEL") {
                toast.error(data.error, {
                  action: {
                    label: "Open Settings",
                    onClick: () => window.location.assign("/settings"),
                  },
                  duration: 8000,
                });
              } else {
                toast.error(data.error || "Embedding failed");
              }
            }
          }
        }
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

      const npsImpact = nps
        ? `NPS Score: ${nps.npsScore} (${nps.promoterPct}% promoters, ${nps.detractorPct}% detractors)`
        : "NPS data unavailable";

      // Group by category for per-category issues
      const byCategory = new Map<string, CommentRow[]>();
      for (const c of withText) {
        const cat = c.categoryName || "Uncategorized";
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(c);
      }

      let created = 0;
      for (const [catName, catComments] of byCategory) {
        const topComments = catComments.slice(0, 10).map((c) => ({
          text: c.commentText!,
          nps: c.npsScore ?? 0,
        }));

        const res = await fetch(`/api/projects/${projectId}/github/issues`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryName: catName,
            commentCount: catComments.length,
            npsImpact,
            topComments,
            recommendation: `Review the ${catComments.length} selected comments in "${catName}" and address the feedback.`,
          }),
        });
        if (res.ok) created++;
      }

      if (created > 0) {
        toast.success(`Created ${created} GitHub issue${created > 1 ? "s" : ""} (one per category)`);
      } else {
        toast.error("Failed to create issues");
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
    setCategoryFilters(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
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
            <Sparkles className="size-5 text-primary" />
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Comments need to be classified before viewing the dashboard.
          </p>
          {classifying && (
            <div className="p-3 rounded-lg bg-muted border border-border">
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-muted-foreground">
          <Filter className="size-4 shrink-0" />
          <Badge variant="outline">
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
          {categoryFilters.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-sm text-muted-foreground">Filtered by:</span>
              {categoryFilters.map(cat => (
                <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                  {cat}
                  <button onClick={() => handleCategoryFilter(cat)} className="ml-1 hover:text-foreground">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {categoryFilters.length > 1 && (
                <button
                  onClick={() => { setCategoryFilters([]); setPage(1); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
          <CategoryBreakdown
            categories={categoryBreakdown}
            activeCategories={categoryFilters}
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

      {/* Partial embedding resume banner */}
      {partialEmbedding && !chatEnabled && !embedding && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-muted-foreground">
          <span>Embeddings incomplete — some comments were not embedded in a previous run.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setPartialEmbedding(null); handleEnableChat(); }}
          >
            Resume Embedding
          </Button>
        </div>
      )}

      {/* Embedding progress banner */}
      {embedding && embeddingProgress && (
        <div className="fixed top-[49px] left-0 right-0 z-40 bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          {embeddingProgress}
        </div>
      )}

      {/* Floating Chat FAB + Overlay */}
      {chatOpen && chatEnabled && (
        <div className="fixed bottom-20 right-6 z-50 w-[420px] h-[500px] shadow-2xl rounded-xl border border-border bg-card overflow-hidden">
          <ChatPanel
            projectId={projectId}
            onClose={() => setChatOpen(false)}
            filters={{ feedbackType, category: categoryFilters.join(","), search, actionable: actionableFilter || undefined }}
            onCitationClick={(commentId) => {
              const el = document.getElementById(`comment-${commentId}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("ring-2", "ring-primary");
                setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 3000);
              }
            }}
          />
        </div>
      )}

      <button
        onClick={() => {
          if (chatEnabled) {
            setChatOpen((o) => !o);
          } else if (!embedding) {
            handleEnableChat();
          }
        }}
        disabled={embedding}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {embedding ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm font-medium">Embedding...</span>
          </>
        ) : chatOpen && chatEnabled ? (
          <>
            <X className="size-5" />
            <span className="text-sm font-medium">Close</span>
          </>
        ) : (
          <>
            <MessageSquare className="size-5" />
            <span className="text-sm font-medium">
              {chatEnabled ? "Chat" : "Enable Chat"}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
