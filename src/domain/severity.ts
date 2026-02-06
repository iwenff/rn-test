type Stats = {
  jsErrors?: number;
  failedRequests?: number;
  pendingRequests?: number;
  rageClicks?: number;
  deadClicks?: number;
};

export function calculateSeverity(stats: Stats = {}, corrupted?: boolean) {
  const log = (v: number | undefined) => Math.log10((v ?? 0) + 1);

  let score =
    4 * log(stats.jsErrors) +
    3 * log(stats.failedRequests) +
    2.5 * log(stats.pendingRequests) +
    1.5 * log(stats.rageClicks) +
    1 * log(stats.deadClicks);

  if (corrupted) score += 15;

  return Math.round(score * 10) / 10;
}
