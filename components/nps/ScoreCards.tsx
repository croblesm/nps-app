"use client";

import { NPS_THRESHOLDS } from "@/lib/nps/calculator";

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

interface ScoreCardsProps {
  nps: NpsStats;
  npsLabel: string;
  feedbackType: string;
  onFeedbackTypeChange: (type: string) => void;
}

export function ScoreCards({
  nps,
  npsLabel,
  feedbackType,
  onFeedbackTypeChange,
}: ScoreCardsProps) {
  function toggle(type: string) {
    onFeedbackTypeChange(feedbackType === type ? "" : type);
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      <button
        onClick={() => onFeedbackTypeChange("")}
        className={`p-4 rounded-lg text-left transition-colors ${
          !feedbackType
            ? "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground"
            : "bg-card ring-1 ring-foreground/10 hover:ring-primary/30"
        }`}
      >
        <div className={`text-xs uppercase tracking-wide ${!feedbackType ? "text-white/70" : "text-muted-foreground"}`}>
          Total Responses
        </div>
        <div className="text-2xl font-bold mt-1">{nps.total}</div>
      </button>
      <button
        onClick={() => toggle("promoter")}
        className={`p-4 rounded-lg text-left transition-colors ${
          feedbackType === "promoter"
            ? "bg-gradient-to-br from-[var(--nps-promoter)]/80 to-[var(--nps-promoter)] text-white"
            : "bg-card ring-1 ring-foreground/10 hover:ring-foreground/20"
        }`}
      >
        <div className={`text-xs uppercase tracking-wide ${feedbackType === "promoter" ? "text-white/70" : "text-muted-foreground"}`}>
          Promoters ({NPS_THRESHOLDS.PROMOTER_MIN}-10)
        </div>
        <div className="text-2xl font-bold mt-1">{nps.promoters}</div>
        <div className={`text-xs ${feedbackType === "promoter" ? "text-white/70" : "text-muted-foreground"}`}>{nps.promoterPct}%</div>
      </button>
      <button
        onClick={() => toggle("passive")}
        className={`p-4 rounded-lg text-left transition-colors ${
          feedbackType === "passive"
            ? "bg-gradient-to-br from-[var(--nps-passive)]/80 to-[var(--nps-passive)] text-white"
            : "bg-card ring-1 ring-foreground/10 hover:ring-foreground/20"
        }`}
      >
        <div className={`text-xs uppercase tracking-wide ${feedbackType === "passive" ? "text-white/70" : "text-muted-foreground"}`}>
          Passives ({NPS_THRESHOLDS.PASSIVE_MIN}-{NPS_THRESHOLDS.PASSIVE_MAX})
        </div>
        <div className="text-2xl font-bold mt-1">{nps.passives}</div>
        <div className={`text-xs ${feedbackType === "passive" ? "text-white/70" : "text-muted-foreground"}`}>{nps.passivePct}%</div>
      </button>
      <button
        onClick={() => toggle("detractor")}
        className={`p-4 rounded-lg text-left transition-colors ${
          feedbackType === "detractor"
            ? "bg-gradient-to-br from-[var(--nps-detractor)]/80 to-[var(--nps-detractor)] text-white"
            : "bg-card ring-1 ring-foreground/10 hover:ring-foreground/20"
        }`}
      >
        <div className={`text-xs uppercase tracking-wide ${feedbackType === "detractor" ? "text-white/70" : "text-muted-foreground"}`}>
          Detractors (0-{NPS_THRESHOLDS.DETRACTOR_MAX})
        </div>
        <div className="text-2xl font-bold mt-1">{nps.detractors}</div>
        <div className={`text-xs ${feedbackType === "detractor" ? "text-white/70" : "text-muted-foreground"}`}>{nps.detractorPct}%</div>
      </button>
      <div
        className={`p-4 rounded-lg text-white ${
          nps.npsScore >= 70
            ? "bg-[var(--nps-excellent)]"
            : nps.npsScore >= 30
            ? "bg-[var(--nps-promoter)]"
            : nps.npsScore >= 0
            ? "bg-[var(--nps-passive)]"
            : "bg-[var(--nps-detractor)]"
        }`}
      >
        <div className="text-xs uppercase tracking-wide opacity-70">
          NPS Score
        </div>
        <div className="text-2xl font-bold mt-1">
          {nps.npsScore}
        </div>
        <div className="text-xs opacity-70">{npsLabel}</div>
      </div>
    </div>
  );
}
