import { describe, it, expect } from "vitest";
import {
  calculateNps,
  npsLabel,
  isPromoter,
  isPassive,
  isDetractor,
  NPS_THRESHOLDS,
} from "@/lib/nps/calculator";

describe("NPS_THRESHOLDS", () => {
  it("defines correct boundaries", () => {
    expect(NPS_THRESHOLDS.PROMOTER_MIN).toBe(9);
    expect(NPS_THRESHOLDS.PASSIVE_MIN).toBe(7);
    expect(NPS_THRESHOLDS.PASSIVE_MAX).toBe(8);
    expect(NPS_THRESHOLDS.DETRACTOR_MAX).toBe(6);
  });
});

describe("isPromoter / isPassive / isDetractor", () => {
  it("classifies score 10 as promoter", () => {
    expect(isPromoter(10)).toBe(true);
    expect(isPassive(10)).toBe(false);
    expect(isDetractor(10)).toBe(false);
  });

  it("classifies score 9 as promoter", () => {
    expect(isPromoter(9)).toBe(true);
  });

  it("classifies score 8 as passive", () => {
    expect(isPromoter(8)).toBe(false);
    expect(isPassive(8)).toBe(true);
    expect(isDetractor(8)).toBe(false);
  });

  it("classifies score 7 as passive", () => {
    expect(isPassive(7)).toBe(true);
  });

  it("classifies score 6 as detractor", () => {
    expect(isPromoter(6)).toBe(false);
    expect(isPassive(6)).toBe(false);
    expect(isDetractor(6)).toBe(true);
  });

  it("classifies score 0 as detractor", () => {
    expect(isDetractor(0)).toBe(true);
  });
});

describe("calculateNps", () => {
  it("returns zeros for empty input", () => {
    const result = calculateNps([]);
    expect(result.total).toBe(0);
    expect(result.npsScore).toBe(0);
  });

  it("returns zeros for all null scores", () => {
    const result = calculateNps([null, null, null]);
    expect(result.total).toBe(0);
  });

  it("calculates NPS for all promoters", () => {
    const result = calculateNps([9, 10, 10, 9]);
    expect(result.total).toBe(4);
    expect(result.promoters).toBe(4);
    expect(result.passives).toBe(0);
    expect(result.detractors).toBe(0);
    expect(result.npsScore).toBe(100);
  });

  it("calculates NPS for all detractors", () => {
    const result = calculateNps([0, 1, 2, 3]);
    expect(result.npsScore).toBe(-100);
    expect(result.detractors).toBe(4);
  });

  it("calculates NPS for mixed scores", () => {
    // 2 promoters, 1 passive, 2 detractors = (2-2)/5 * 100 = 0
    const result = calculateNps([10, 9, 8, 3, 1]);
    expect(result.total).toBe(5);
    expect(result.promoters).toBe(2);
    expect(result.passives).toBe(1);
    expect(result.detractors).toBe(2);
    expect(result.npsScore).toBe(0);
  });

  it("ignores null scores in calculation", () => {
    const result = calculateNps([10, null, 9, null, 1]);
    expect(result.total).toBe(3);
    expect(result.promoters).toBe(2);
    expect(result.detractors).toBe(1);
    expect(result.npsScore).toBe(33); // (2-1)/3 * 100 = 33.33 → 33
  });

  it("calculates correct percentages", () => {
    const result = calculateNps([10, 8, 3, 2]);
    expect(result.promoterPct).toBe(25);
    expect(result.passivePct).toBe(25);
    expect(result.detractorPct).toBe(50);
  });

  it("matches expected NPS of 18 for the reference dataset distribution", () => {
    // Original app showed NPS 18 for 384 responses: 160 promoters, 133 passives, 91 detractors
    const scores: number[] = [
      ...Array(160).fill(9),
      ...Array(133).fill(8),
      ...Array(91).fill(5),
    ];
    const result = calculateNps(scores);
    expect(result.npsScore).toBe(18); // (160-91)/384 * 100 = 17.97 → 18
  });
});

describe("npsLabel", () => {
  it("returns Excellent for score >= 50", () => {
    expect(npsLabel(50)).toBe("Excellent");
    expect(npsLabel(80)).toBe("Excellent");
  });

  it("returns Very Good for score >= 30", () => {
    expect(npsLabel(30)).toBe("Very Good");
    expect(npsLabel(49)).toBe("Very Good");
  });

  it("returns Good for score >= 0", () => {
    expect(npsLabel(0)).toBe("Good");
    expect(npsLabel(18)).toBe("Good");
  });

  it("returns Needs Work for score >= -30", () => {
    expect(npsLabel(-1)).toBe("Needs Work");
    expect(npsLabel(-30)).toBe("Needs Work");
  });

  it("returns Critical for score < -30", () => {
    expect(npsLabel(-31)).toBe("Critical");
    expect(npsLabel(-100)).toBe("Critical");
  });
});
