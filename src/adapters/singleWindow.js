import { ogdScreen } from "../reference/referenceData.js";

/* ------------------------------------------------------------------ */
/*  Single Window / OGD adapter — STUB over reference data.            */
/*  Screens lines for other-government-department release requirements   */
/*  using the versioned OGD ruleset. Real transmission drops in behind   */
/*  the same call.                                                       */
/* ------------------------------------------------------------------ */
export function screenShipment(lines) {
  const hits = [];
  for (const line of lines || []) {
    const hs = line.classification?.hs;
    const found = ogdScreen(line.description, hs);
    for (const f of found) {
      if (f.requirement) hits.push({ lineId: line.id, description: line.description, dept: f.dept, requirement: f.requirement });
    }
  }
  return hits;
}
