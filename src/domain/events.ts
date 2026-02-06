export type EventItem = {
  type: string;
};

export type SessionDetails = {
  id: string;
  events?: EventItem[];
};

export function toSequence(events: EventItem[] = []) {
  return events.map((e) => e.type.split(".")[0]);
}

function lcsTable(a: string[], b: string[]) {
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

export function lcsLength(a: string[], b: string[]) {
  const dp = lcsTable(a, b);
  return dp[a.length][b.length];
}

export function similarityScore(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  return lcsLength(a, b) / Math.max(a.length, b.length);
}

export type DiffRow = {
  a?: string;
  b?: string;
  same: boolean;
};

export function buildDiff(a: string[], b: string[]): DiffRow[] {
  const dp = lcsTable(a, b);

  let i = a.length;
  let j = b.length;

  const result: DiffRow[] = [];

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
