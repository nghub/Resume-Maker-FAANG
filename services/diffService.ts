
export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Computes a line-by-line diff between two strings using a Longest Common Subsequence (LCS) approach.
 * This compares the new text against the previous text to identify exactly which lines are new or modified.
 * It uses trimEnd() for comparison to ignore invisible trailing whitespace differences often introduced by AI.
 */
export const computeLineDiff = (oldText: string, newText: string): DiffPart[] => {
  // Handle edge cases
  if (!oldText && !newText) return [];
  if (!oldText) return newText.split('\n').map(line => ({ value: line, added: true }));
  if (!newText) return [];

  // Split texts into lines
  const oldLines = oldText.replace(/\r\n/g, '\n').split('\n');
  const newLines = newText.replace(/\r\n/g, '\n').split('\n');

  const m = oldLines.length;
  const n = newLines.length;

  // Initialize DP table for LCS
  // dp[i][j] stores the length of LCS of oldLines[0..i-1] and newLines[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      // Compare lines ignoring trailing whitespace (robust for AI outputs)
      if (oldLines[i - 1].trimEnd() === newLines[j - 1].trimEnd()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find which lines in the new text are part of the LCS (unchanged)
  const isLineUnchanged = new Array(n).fill(false);
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (oldLines[i - 1].trimEnd() === newLines[j - 1].trimEnd()) {
      // Lines match, mark as unchanged
      isLineUnchanged[j - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      // Line exists in old but not new (Deletion)
      i--;
    } else {
      // Line exists in new but not old (Addition/Modification)
      j--;
    }
  }

  // Construct the result mapping
  // We only return the lines from the NEW text.
  // If a line was NOT marked as unchanged, it means it's either new or modified.
  return newLines.map((line, index) => ({
    value: line,
    added: !isLineUnchanged[index]
  }));
};
