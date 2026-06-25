import { classify, isCleared } from "./classify.js";
import { lineValue, lineDuty } from "./format.js";

/* Derive per-entry rollups from the raw line items. Classification is   */
/* computed here (not stored) so the data file stays the single source.  */
export function entryStats(entry) {
  const lines = entry.lines.map((l) => ({ ...l, cls: classify(l.description) }));
  const cleared = lines.filter((l) => isCleared(l.cls.conf)).length;
  const review = lines.length - cleared;
  const value = lines.reduce((s, l) => s + (lineValue(l) || 0), 0);
  const duty = lines.reduce((s, l) => s + (lineDuty(l, l.cls) || 0), 0);
  return { lines, cleared, review, value, duty, count: lines.length };
}

/* Workspace-wide rollup across every entry. */
export function workspaceStats(entries) {
  let value = 0;
  let duty = 0;
  let linesNeedingReview = 0;
  let totalLines = 0;
  for (const e of entries) {
    const s = entryStats(e);
    value += s.value;
    duty += s.duty;
    linesNeedingReview += s.review;
    totalLines += s.count;
  }
  return {
    value,
    duty,
    linesNeedingReview,
    totalLines,
    open: entries.filter((e) => e.status !== "filed").length,
    inReview: entries.filter((e) => e.status === "review").length,
    intake: entries.filter((e) => e.status === "intake" || e.status === "classifying").length,
    onHold: entries.filter((e) => e.status === "hold").length,
    filed: entries.filter((e) => e.status === "filed").length,
  };
}
