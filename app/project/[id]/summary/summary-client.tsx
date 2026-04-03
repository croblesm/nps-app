"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/Spinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, RefreshCw, Sparkles } from "lucide-react";
import { NpsVisualCards } from "@/components/nps/NpsVisualCards";
import { useAssistantContext } from "@/lib/assistant-context";

interface SummaryData {
  id: string;
  markdown: string;
  generatedAt: string;
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
}

interface SummaryClientProps {
  initialSummary: SummaryData | null;
  initialStats: NpsStats | null;
  initialPromoterQuotes: { text: string; nps: number }[];
  initialDetractorQuotes: { text: string; nps: number }[];
  projectId: string;
}

export function SummaryClient({
  initialSummary,
  initialStats,
  initialPromoterQuotes,
  initialDetractorQuotes,
  projectId,
}: SummaryClientProps) {
  const [summary, setSummary] = useState<SummaryData | null>(initialSummary);
  const [npsStats] = useState<NpsStats | null>(initialStats);
  const [generating, setGenerating] = useState(false);
  const [promoterQuotes] = useState(initialPromoterQuotes);
  const [detractorQuotes] = useState(initialDetractorQuotes);
  const { setPageContext } = useAssistantContext();

  useEffect(() => {
    setPageContext({
      summaryGenerated: !!summary,
    });
  }, [summary, setPageContext]);

  async function handleGenerate() {
    setGenerating(true);

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (res.ok) {
        setSummary(data);
        toast.success("Summary generated successfully");
      } else {
        toast.error(data.error || "Summary generation failed");
      }
    } catch {
      toast.error("Failed to generate summary. Check your LLM settings.");
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
    <div className="max-w-4xl space-y-4">
      {npsStats && (
        <NpsVisualCards
          npsScore={npsStats.npsScore}
          promoters={npsStats.promoters}
          passives={npsStats.passives}
          detractors={npsStats.detractors}
          promoterPct={npsStats.promoterPct}
          passivePct={npsStats.passivePct}
          detractorPct={npsStats.detractorPct}
          promoterQuotes={promoterQuotes}
          detractorQuotes={detractorQuotes}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <CardTitle className="text-2xl">AI Summary</CardTitle>
          </div>
          <CardDescription>
            Generate an AI-powered insight report
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              {summary && (
                <>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="size-4" />
                    Download .md
                  </Button>
                  <span className="text-xs text-muted-foreground">Charts are shown in-app only</span>
                </>
              )}
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <Spinner size="sm" label="Generating..." />
                ) : summary ? (
                  <>
                    <RefreshCw className="size-4" />
                    Regenerate
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate Summary
                  </>
                )}
              </Button>
            </div>
          </CardAction>
        </CardHeader>

        <CardContent>
          {generating && (
            <div className="p-3 rounded-lg bg-muted border border-border mb-4">
              <Spinner size="sm" label="Generating AI-powered insight report..." />
            </div>
          )}

          {summary && !generating && (
            <div className="markdown-content max-w-none p-6 rounded-lg bg-card ring-1 ring-foreground/10 text-muted-foreground">
              <ReactMarkdown>{summary.markdown}</ReactMarkdown>
            </div>
          )}

          {!summary && !generating && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Sparkles className="size-10 mb-3 opacity-40" />
              <p className="text-sm">No summary generated yet. Click Generate Summary to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
