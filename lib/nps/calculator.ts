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

  const promoters = valid.filter((s) => s >= 9).length;
  const passives = valid.filter((s) => s >= 7 && s <= 8).length;
  const detractors = valid.filter((s) => s <= 6).length;
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

export function npsEmoji(score: number): string {
  if (score >= 50) return "Excellent";
  if (score >= 30) return "Very Good";
  if (score >= 0) return "Good";
  if (score >= -30) return "Needs Work";
  return "Critical";
}
