export function normalizeForSearch(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/**
 * True when every whitespace-separated token in `rawQuery` appears as a
 * substring of `normalizedHaystack` (already passed through normalizeForSearch).
 */
export function normalizedHaystackMatchesQuery(
  normalizedHaystack: string,
  rawQuery: string,
): boolean {
  const normalizedQuery = normalizeForSearch(rawQuery.trim());
  if (!normalizedQuery) return true;
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  return tokens.every((token) => normalizedHaystack.includes(token));
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergeIntervals(intervals: [number, number][]): [number, number][] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  let [curStart, curEnd] = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    if (s <= curEnd) curEnd = Math.max(curEnd, e);
    else {
      out.push([curStart, curEnd]);
      curStart = s;
      curEnd = e;
    }
  }
  out.push([curStart, curEnd]);
  return out;
}

export function searchTokensFromInput(inputValue: string): string[] {
  return inputValue
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function matchRangesInPlainText(
  text: string,
  tokens: string[],
): [number, number][] {
  const ranges: [number, number][] = [];
  for (const token of tokens) {
    let re: RegExp;
    try {
      re = new RegExp(escapeRegExp(token), "gi");
    } catch {
      continue;
    }
    for (const m of text.matchAll(re)) {
      if (m.index !== undefined) ranges.push([m.index, m.index + m[0].length]);
    }
  }
  return mergeIntervals(ranges);
}

export interface HighlightSegment {
  highlight: boolean;
  text: string;
}

function segmentsFromMatchRanges(
  text: string,
  ranges: [number, number][],
): HighlightSegment[] {
  if (!text) return [];
  if (ranges.length === 0) return [{ highlight: false, text }];
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) {
      segments.push({ highlight: false, text: text.slice(cursor, start) });
    }
    if (end > start) {
      segments.push({ highlight: true, text: text.slice(start, end) });
    }
    cursor = Math.max(cursor, end);
  }
  if (cursor < text.length) {
    segments.push({ highlight: false, text: text.slice(cursor) });
  }
  return segments;
}

export function computeHighlightSegments(
  text: string,
  query: string,
): HighlightSegment[] {
  const tokens = searchTokensFromInput(query);
  if (tokens.length === 0) {
    if (!text) return [];
    return [{ highlight: false, text }];
  }
  const ranges = matchRangesInPlainText(text, tokens);
  return segmentsFromMatchRanges(text, ranges);
}
