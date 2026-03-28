import { describe, it, expect } from "vitest";
import { stratifiedSample } from "@/lib/csv/sampler";

describe("stratifiedSample", () => {
  it("returns all comments when under target size", () => {
    const comments = [
      { index: 0, text: "Great", nps: 10 },
      { index: 1, text: "OK", nps: 7 },
    ];
    const result = stratifiedSample(comments, 75);
    expect(result).toHaveLength(2);
  });

  it("filters out empty text", () => {
    const comments = [
      { index: 0, text: "Great", nps: 10 },
      { index: 1, text: "", nps: 7 },
      { index: 2, text: "  ", nps: 5 },
    ];
    const result = stratifiedSample(comments, 75);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Great");
  });

  it("limits to target size", () => {
    const comments = Array.from({ length: 200 }, (_, i) => ({
      index: i,
      text: `Comment ${i}`,
      nps: i % 11,
    }));
    const result = stratifiedSample(comments, 50);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it("includes comments from all NPS buckets", () => {
    const comments = [
      ...Array.from({ length: 50 }, (_, i) => ({ index: i, text: `P${i}`, nps: 10 })),
      ...Array.from({ length: 50 }, (_, i) => ({ index: 50 + i, text: `V${i}`, nps: 7 })),
      ...Array.from({ length: 50 }, (_, i) => ({ index: 100 + i, text: `D${i}`, nps: 3 })),
    ];
    const result = stratifiedSample(comments, 30);

    const promoters = result.filter((c) => c.nps !== null && c.nps >= 9);
    const passives = result.filter((c) => c.nps !== null && c.nps >= 7 && c.nps <= 8);
    const detractors = result.filter((c) => c.nps !== null && c.nps <= 6);

    expect(promoters.length).toBeGreaterThan(0);
    expect(passives.length).toBeGreaterThan(0);
    expect(detractors.length).toBeGreaterThan(0);
  });

  it("handles null NPS scores", () => {
    const comments = [
      { index: 0, text: "Good", nps: null },
      { index: 1, text: "Bad", nps: null },
      { index: 2, text: "OK", nps: 8 },
    ];
    const result = stratifiedSample(comments, 75);
    expect(result).toHaveLength(3);
  });
});
