/**
 * Selects a stratified sample of comments balanced across NPS score ranges.
 * Ensures promoters, passives, and detractors are all represented.
 */
export function stratifiedSample(
  comments: { index: number; text: string; nps: number | null }[],
  targetSize: number = 75
): { index: number; text: string; nps: number | null }[] {
  // Filter to comments with actual text
  const withText = comments.filter(
    (c) => c.text && c.text.trim().length > 0
  );

  if (withText.length <= targetSize) return withText;

  // Split into NPS buckets
  const promoters = withText.filter((c) => c.nps !== null && c.nps >= 9);
  const passives = withText.filter(
    (c) => c.nps !== null && c.nps >= 7 && c.nps <= 8
  );
  const detractors = withText.filter((c) => c.nps !== null && c.nps <= 6);
  const noScore = withText.filter((c) => c.nps === null);

  // Allocate proportionally, minimum 5 per bucket if available
  const buckets = [promoters, passives, detractors, noScore].filter(
    (b) => b.length > 0
  );
  const perBucket = Math.max(5, Math.floor(targetSize / buckets.length));

  const sampled: typeof withText = [];

  for (const bucket of buckets) {
    const shuffled = [...bucket].sort(() => Math.random() - 0.5);
    sampled.push(...shuffled.slice(0, perBucket));
  }

  // If we haven't reached target, fill from remaining
  if (sampled.length < targetSize) {
    const sampledIndices = new Set(sampled.map((s) => s.index));
    const remaining = withText
      .filter((c) => !sampledIndices.has(c.index))
      .sort(() => Math.random() - 0.5);
    sampled.push(...remaining.slice(0, targetSize - sampled.length));
  }

  return sampled.slice(0, targetSize);
}
