/** NPS score thresholds — single source of truth */
export const NPS_THRESHOLDS = {
  PROMOTER_MIN: 9,
  PASSIVE_MIN: 7,
  PASSIVE_MAX: 8,
  DETRACTOR_MAX: 6,
} as const;

export const NPS_LABELS = {
  EXCELLENT: { min: 50, label: "Excellent" },
  VERY_GOOD: { min: 30, label: "Very Good" },
  GOOD: { min: 0, label: "Good" },
  NEEDS_WORK: { min: -30, label: "Needs Work" },
  CRITICAL: { min: -Infinity, label: "Critical" },
} as const;

export interface NpsStats {
  total: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
}

export function isPromoter(score: number): boolean {
  return score >= NPS_THRESHOLDS.PROMOTER_MIN;
}

export function isPassive(score: number): boolean {
  return score >= NPS_THRESHOLDS.PASSIVE_MIN && score <= NPS_THRESHOLDS.PASSIVE_MAX;
}

export function isDetractor(score: number): boolean {
  return score <= NPS_THRESHOLDS.DETRACTOR_MAX;
}

export function calculateNps(scores: (number | null)[]): NpsStats {
  const valid = scores.filter((s): s is number => s !== null);
  const total = valid.length;

  if (total === 0) {
    return {
      total: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      npsScore: 0,
      promoterPct: 0,
      passivePct: 0,
      detractorPct: 0,
    };
  }

  const promoters = valid.filter(isPromoter).length;
  const passives = valid.filter(isPassive).length;
  const detractors = valid.filter(isDetractor).length;
  const npsScore = Math.round(((promoters - detractors) / total) * 100);

  return {
    total,
    promoters,
    passives,
    detractors,
    npsScore,
    promoterPct: Math.round((promoters / total) * 100),
    passivePct: Math.round((passives / total) * 100),
    detractorPct: Math.round((detractors / total) * 100),
  };
}

export function npsLabel(score: number): string {
  if (score >= NPS_LABELS.EXCELLENT.min) return NPS_LABELS.EXCELLENT.label;
  if (score >= NPS_LABELS.VERY_GOOD.min) return NPS_LABELS.VERY_GOOD.label;
  if (score >= NPS_LABELS.GOOD.min) return NPS_LABELS.GOOD.label;
  if (score >= NPS_LABELS.NEEDS_WORK.min) return NPS_LABELS.NEEDS_WORK.label;
  return NPS_LABELS.CRITICAL.label;
}
