import { proposeClassification, isCleared } from "./classify.js";
import { simaScreen, ogdScreen, dutyRateForHs, gstRate } from "../reference/referenceData.js";
import { extValue, toCad } from "./format.js";
import { CLS_STATUS } from "../domain/constants.js";

/* Per-line view model: the committed decision if present, else the live  */
/* AI proposal (clearly the draft state).                                 */
export function lineView(line) {
  const proposal = proposeClassification(line);
  const committed = line.classification && [CLS_STATUS.accepted, CLS_STATUS.edited].includes(line.classification.status)
    ? line.classification
    : null;
  const hs = committed?.hs || proposal.hs;
  const conf = committed ? 1 : proposal.confidence;
  return { line, proposal, committed, hs, conf, decided: !!committed };
}

/* Shipment rollup used by the worklist, the list, and the file header.   */
export function summarize(shipment) {
  const lines = (shipment.lines || []).map(lineView);
  const lineCount = lines.length;
  const decided = lines.filter((l) => l.decided).length;
  const needsReview = lines.filter((l) => !l.decided && !isCleared(l.proposal.confidence)).length;

  let value = 0;
  let duty = 0;
  for (const l of lines) {
    const ext = toCad(extValue(l.line), l.line.currency) || 0;
    value += ext;
    const d = dutyRateForHs(l.hs);
    if (d && d.rate != null) duty += ext * d.rate;
  }
  const gst = (value + duty) * gstRate();

  const sima = lines.flatMap((l) => simaScreen(l.hs, l.line.origin).map((m) => ({ line: l.line, measure: m })));
  const ogd = lines.flatMap((l) => ogdScreen(l.line.description, l.hs).filter((r) => r.requirement).map((r) => ({ line: l.line, req: r })));

  return { lines, lineCount, decided, needsReview, value, duty, gst, sima, ogd, allDecided: lineCount > 0 && decided === lineCount };
}
