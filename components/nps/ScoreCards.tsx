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
            ? "bg-blue-600 text-white"
            : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500"
        }`}
      >
        <div className="text-xs uppercase tracking-wide opacity-70">
          Total Responses
        </div>
        <div className="text-2xl font-bold mt-1">{nps.total}</div>
      </button>
      <button
        onClick={() => toggle("promoter")}
        className={`p-4 rounded-lg text-left transition-colors ${
          feedbackType === "promoter"
            ? "bg-green-600 text-white"
            : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-green-500"
        }`}
      >
        <div className="text-xs uppercase tracking-wide opacity-70">
          Promoters ({NPS_THRESHOLDS.PROMOTER_MIN}-10)
        </div>
        <div className="text-2xl font-bold mt-1">{nps.promoters}</div>
        <div className="text-xs opacity-70">{nps.promoterPct}%</div>
      </button>
      <button
        onClick={() => toggle("passive")}
        className={`p-4 rounded-lg text-left transition-colors ${
          feedbackType === "passive"
            ? "bg-yellow-600 text-white"
            : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-yellow-500"
        }`}
      >
        <div className="text-xs uppercase tracking-wide opacity-70">
          Passives ({NPS_THRESHOLDS.PASSIVE_MIN}-{NPS_THRESHOLDS.PASSIVE_MAX})
        </div>
        <div className="text-2xl font-bold mt-1">{nps.passives}</div>
        <div className="text-xs opacity-70">{nps.passivePct}%</div>
      </button>
      <button
        onClick={() => toggle("detractor")}
        className={`p-4 rounded-lg text-left transition-colors ${
          feedbackType === "detractor"
            ? "bg-red-600 text-white"
            : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-500"
        }`}
      >
        <div className="text-xs uppercase tracking-wide opacity-70">
          Detractors (0-{NPS_THRESHOLDS.DETRACTOR_MAX})
        </div>
        <div className="text-2xl font-bold mt-1">{nps.detractors}</div>
        <div className="text-xs opacity-70">{nps.detractorPct}%</div>
      </button>
      <div className="p-4 rounded-lg bg-purple-600 text-white">
        <div className="text-xs uppercase tracking-wide opacity-70">
          NPS Score
        </div>
        <div className="text-2xl font-bold mt-1">{nps.npsScore}</div>
        <div className="text-xs opacity-70">{npsLabel}</div>
      </div>
    </div>
  );
}
