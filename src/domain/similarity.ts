export type EventLike = {
  type: string;
};


export function toSequence(events: EventLike[] = []): string[] {
  return events.map((e) => e.type.split(".")[0]);
}

export function lcs(a: string[], b: string[]): number {
  const dp = Array(a.length + 1)
    .fill(0)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  return dp[a.length][b.length];
}

export function similarityScore(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;

  return lcs(a, b) / Math.max(a.length, b.length);
}

export function buildLcsTable(a: string[], b: string[]): number[][] {
  const dp = Array(a.length + 1)
    .fill(0)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  return dp;
}

export function buildDiff(
  a: string[],
  b: string[]
): {
  a?: string;
  b?: string;
  same: boolean;
}[] {
  const dp = buildLcsTable(a, b);

  let i = a.length;
  let j = b.length;

  const result: {
    a?: string;
    b?: string;
    same: boolean;
  }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({
        a: a[i - 1],
        b: b[j - 1],
        same: true,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1]?.[j])) {
      result.unshift({
        b: b[j - 1],
        same: false,
      });
      j--;
    } else {
      result.unshift({
        a: a[i - 1],
        same: false,
      });
      i--;
    }
  }

  return result;
}
