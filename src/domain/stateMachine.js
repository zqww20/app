import { CLS_STATUS } from "./constants.js";

/* ------------------------------------------------------------------ */
/*  Shipment state machine.                                            */
/*  Transitions are declarative. Each carries: a target state, a label, */
/*  whether it needs sign-off authority, whether it is an out-of-band   */
/*  "return", whether a reason is required, and a guard that returns    */
/*  specific blockers when the move isn't allowed yet.                  */
/*                                                                      */
/*  Nothing advances silently: a guard with blockers explains exactly   */
/*  what's missing, in operational language. Blockers can be overridden  */
/*  explicitly (logged) only where `allowOverride` is true.             */
/* ------------------------------------------------------------------ */

/* --- guards: (ctx) => string[] of blockers (empty = clear) ---------- */

function requireIntakeConfirmed({ shipment }) {
  const b = [];
  if (!shipment.intake?.headerConfirmed) b.push("Shipment header has not been confirmed against the source documents.");
  if (!shipment.lines?.length) b.push("No line items have been extracted or entered.");
  else if (!shipment.intake?.linesConfirmed) b.push("Extracted line set has not been confirmed by the clerk.");
  return b;
}

function requireAllClassified({ shipment }) {
  const b = [];
  if (!shipment.lines?.length) return ["No line items to classify."];
  const undecided = shipment.lines.filter(
    (l) => !l.classification || ![CLS_STATUS.accepted, CLS_STATUS.edited].includes(l.classification.status)
  );
  if (undecided.length) {
    b.push(
      `${undecided.length} of ${shipment.lines.length} line${undecided.length === 1 ? "" : "s"} ` +
        "still need an accepted classification (proposed codes are not yet committed)."
    );
  }
  return b;
}

function requireValuation({ shipment }) {
  // Phase 2 builds the full valuation workspace. For the spine we only
  // require that a method has been recorded for the shipment.
  if (!shipment.valuation?.method) {
    return ["No value-for-duty method recorded. Record a valuation method to advance (full valuation workspace lands in phase 2)."];
  }
  return [];
}

function requireAssessment({ shipment }) {
  if (!shipment.assessment?.reviewed) {
    return ["Duty/tax/SIMA/OGD assessment has not been reviewed. SIMA and OGD screening is required before preparing release (full assessment lands in phase 3)."];
  }
  return [];
}

function requireReleaseReady({ shipment, importer }) {
  const b = [];
  // Importer checkpoint (5.1): valid agency authority + active RPP security.
  if (!importer) b.push("Shipment is not linked to an importer file.");
  else {
    if (!importer.agencyAuthority?.valid) b.push("Importer has no valid agency agreement / power of attorney on file.");
    if (importer.agencyAuthority?.valid && isExpired(importer.agencyAuthority.expiry))
      b.push(`Importer agency authority expired ${importer.agencyAuthority.expiry}.`);
    if (!importer.rpp?.active) b.push("Importer has no active Release Prior to Payment (RPP) financial security recorded.");
    if (importer.rpp?.active && isExpired(importer.rpp.expiry))
      b.push(`Importer RPP security expired ${importer.rpp.expiry}.`);
  }
  // Classification must be committed.
  b.push(...requireAllClassified({ shipment }));
  return dedupe(b);
}

function requireCadReady({ shipment }) {
  if (shipment.state !== "in_accounting") return [];
  if (!shipment.accounting?.assembled)
    return ["Commercial Accounting Declaration has not been assembled from the released file."];
  return [];
}

/* --- helpers -------------------------------------------------------- */
function isExpired(dateStr) {
  if (!dateStr) return false;
  // Reference "today" for the prototype clock.
  return dateStr < TODAY;
}
export const TODAY = "2026-06-25";
function dedupe(arr) {
  return [...new Set(arr)];
}

/* --- transition graph ----------------------------------------------- */
/* kind: 'advance' | 'return' | 'signoff'                                */
const T = {
  awaiting_documents: [{ to: "in_intake", label: "Mark documents received", kind: "advance" }],
  in_intake: [
    { to: "in_classification", label: "Advance to classification", kind: "advance", guard: requireIntakeConfirmed },
    { to: "awaiting_documents", label: "Return — documents incomplete", kind: "return", requireReason: true },
  ],
  in_classification: [
    { to: "in_valuation", label: "Advance to valuation", kind: "advance", guard: requireAllClassified, allowOverride: false },
    { to: "in_intake", label: "Return to intake", kind: "return", requireReason: true },
  ],
  in_valuation: [
    { to: "in_assessment", label: "Advance to assessment", kind: "advance", guard: requireValuation, allowOverride: true },
    { to: "in_classification", label: "Return to classification", kind: "return", requireReason: true },
  ],
  in_assessment: [
    { to: "pending_release_signoff", label: "Prepare release request", kind: "advance", guard: requireAssessment, allowOverride: true },
    { to: "in_valuation", label: "Return to valuation", kind: "return", requireReason: true },
  ],
  pending_release_signoff: [
    { to: "released", label: "Sign off & transmit release", kind: "signoff", requiresSignoff: true, guard: requireReleaseReady },
    { to: "in_classification", label: "Return to classification", kind: "return", requireReason: true },
  ],
  released: [
    { to: "in_accounting", label: "Begin accounting (CAD)", kind: "advance" },
    { to: "under_correction", label: "Open post-entry correction", kind: "return", requireReason: true },
  ],
  in_accounting: [
    { to: "accounted", label: "Sign off & submit CAD", kind: "signoff", requiresSignoff: true, guard: requireCadReady },
    { to: "released", label: "Return to released", kind: "return", requireReason: true },
  ],
  accounted: [
    { to: "billed", label: "Issue client invoice", kind: "advance" },
    { to: "under_correction", label: "Open correction", kind: "return", requireReason: true },
  ],
  billed: [
    { to: "archived", label: "Archive file", kind: "advance" },
    { to: "under_correction", label: "Open correction", kind: "return", requireReason: true },
  ],
  under_correction: [
    { to: "accounted", label: "Sign off correction (CAD revision)", kind: "signoff", requiresSignoff: true, requireReason: true },
  ],
  archived: [{ to: "under_correction", label: "Reopen for post-entry correction", kind: "return", requireReason: true }],
};

/* All transitions available from the current state, each annotated with  */
/* its evaluated blockers given the current context.                      */
export function availableTransitions(ctx) {
  const list = T[ctx.shipment.state] || [];
  return list.map((t) => {
    const blockers = t.guard ? t.guard(ctx) : [];
    return { ...t, blockers, blocked: blockers.length > 0 };
  });
}

export function transitionByTarget(ctx, target) {
  return availableTransitions(ctx).find((t) => t.to === target) || null;
}

/* Can this user perform the move? Returns {ok, reason}. */
export function canPerform(transition, { hasSignoff }) {
  if (transition.requiresSignoff && !hasSignoff) {
    return { ok: false, reason: "Requires sign-off authority. Reassign to a licensed broker to file." };
  }
  return { ok: true };
}
