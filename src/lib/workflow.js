import { stateOf, CLS_STATUS } from "../domain/constants.js";
import { availableTransitions } from "../domain/stateMachine.js";
import { daysFromToday } from "./format.js";

/* ------------------------------------------------------------------ */
/*  The workflow engine.                                               */
/*  A broker doesn't work "states", they work the next action: the one  */
/*  thing to do, who owns it, and the clock. This derives that for any  */
/*  file from its state + the state-machine guards, so the whole UI can */
/*  be organised around action, not status.                            */
/* ------------------------------------------------------------------ */

/* Owners — internal roles, the broker (sign-off), or external (chase). */
export const OWNERS = {
  release_clerk: { label: "Release clerk", kind: "role", role: "release_clerk" },
  classification_specialist: { label: "Classification", kind: "role", role: "classification_specialist" },
  compliance_advisor: { label: "Compliance", kind: "role", role: "compliance_advisor" },
  accounting: { label: "Accounting", kind: "role", role: "accounting" },
  operations_manager: { label: "Operations", kind: "role", role: "operations_manager" },
  broker: { label: "Licensed broker", kind: "signoff" },
  importer: { label: "Importer", kind: "external" },
  none: { label: "—", kind: "none" },
};

function committed(line) {
  return line.classification && [CLS_STATUS.accepted, CLS_STATUS.edited].includes(line.classification.status);
}

/* The single next action for a file. */
export function nextAction(shipment, importer) {
  const s = shipment.state;
  const lines = shipment.lines || [];

  const A = (o) => ({ blocked: false, blockers: [], external: false, needsSignoff: false, ...o });

  switch (s) {
    case "awaiting_documents":
      return A({ key: "add_docs", label: "Add documents", short: "Add docs", owner: "release_clerk", cta: { kind: "station", stage: "intake" } });

    case "in_intake": {
      if (!lines.length)
        return A({ key: "extract", label: "Extract or enter line items", short: "Extract lines", owner: "release_clerk", cta: { kind: "station", stage: "intake" } });
      if (!shipment.intake?.headerConfirmed || !shipment.intake?.linesConfirmed)
        return A({ key: "confirm_intake", label: `Confirm header & ${lines.length} lines`, short: "Confirm intake", owner: "release_clerk", cta: { kind: "station", stage: "intake" } });
      return A({ key: "advance_class", label: "Advance to classification", short: "To classification", owner: "release_clerk", cta: { kind: "transition", target: "in_classification" } });
    }

    case "in_classification": {
      const undecided = lines.filter((l) => !committed(l)).length;
      if (undecided > 0)
        return A({ key: "classify", label: `Classify ${undecided} line${undecided === 1 ? "" : "s"}`, short: `Classify ${undecided}`, owner: "classification_specialist", cta: { kind: "station", stage: "classification" } });
      return A({ key: "advance_val", label: "Advance to valuation", short: "To valuation", owner: "classification_specialist", cta: { kind: "transition", target: "in_valuation" } });
    }

    case "in_valuation":
      return A({ key: "valuation", label: shipment.valuation?.method ? "Confirm valuation & advance" : "Record value-for-duty method", short: "Valuation", owner: "release_clerk", cta: { kind: "station", stage: "valuation" } });

    case "in_assessment":
      return A({ key: "assess", label: shipment.assessment?.reviewed ? "Prepare release request" : "Review assessment & SIMA/OGD", short: "Assessment", owner: "compliance_advisor", cta: { kind: "station", stage: "assessment" } });

    case "pending_release_signoff": {
      const tr = availableTransitions({ shipment, importer }).find((t) => t.to === "released");
      const blockers = tr?.blockers || [];
      if (blockers.length) {
        // is the block on the importer (external chase) or internal?
        const external = blockers.some((b) => /agency|RPP|security|delegation|importer/i.test(b));
        return A({ key: "release_blocked", label: "Resolve before release", short: "Blocked", owner: external ? "importer" : "operations_manager", external, blocked: true, blockers, cta: { kind: "station", stage: "release" } });
      }
      return A({ key: "signoff_release", label: "Sign off & transmit release", short: "Sign off release", owner: "broker", needsSignoff: true, cta: { kind: "transition", target: "released" } });
    }

    case "released":
      return A({ key: "begin_cad", label: "Begin accounting (CAD)", short: "Begin CAD", owner: "accounting", cta: { kind: "transition", target: "in_accounting" } });

    case "in_accounting":
      if (!shipment.accounting?.assembled)
        return A({ key: "assemble_cad", label: "Assemble CAD from released file", short: "Assemble CAD", owner: "accounting", cta: { kind: "station", stage: "accounting" } });
      return A({ key: "submit_cad", label: "Sign off & submit CAD", short: "Submit CAD", owner: "broker", needsSignoff: true, cta: { kind: "transition", target: "accounted" } });

    case "accounted":
      return A({ key: "invoice", label: "Issue client invoice", short: "Invoice", owner: "accounting", cta: { kind: "transition", target: "billed" } });

    case "billed":
      return A({ key: "archive", label: "Archive file", short: "Archive", owner: "operations_manager", cta: { kind: "transition", target: "archived" } });

    case "under_correction":
      return A({ key: "correction", label: "Sign off CAD revision", short: "Correction", owner: "broker", needsSignoff: true, cta: { kind: "transition", target: "accounted" } });

    default:
      return A({ key: "none", label: "No action", short: "—", owner: "none", cta: { kind: "none" } });
  }
}

/* The clock. Pre-release files are paced by ETA (cargo can't sit at the   */
/* border); post-release by the CARM accounting window.                   */
export function urgency(shipment) {
  const stage = stateOf(shipment.state).stage;
  if (shipment.state === "archived" || stage === "billing") return { level: "none", label: "" };

  if (shipment.state === "released" || stage === "accounting") {
    return { level: "normal", label: "account within CARM window", clock: "cad" };
  }

  const d = daysFromToday(shipment.etaDate);
  if (d == null) return { level: "normal", label: "no ETA" };
  if (d < 0) return { level: "overdue", days: d, label: `arrived ${Math.abs(d)}d ago` };
  if (d === 0) return { level: "today", days: 0, label: "arriving today" };
  if (d <= 2) return { level: "soon", days: d, label: `arriving in ${d}d` };
  return { level: "normal", days: d, label: `ETA in ${d}d` };
}

const URGENCY_TONE = { overdue: "alert", today: "alert", soon: "warn", normal: "neutral", none: "muted" };
export const urgencyTone = (level) => URGENCY_TONE[level] || "neutral";

/* Lower sort score = work it sooner. Blocked + arrived/arriving rises.    */
export function priority(shipment, action, urg) {
  let score = 1000;
  if (action.blocked) score -= 250;
  const byLevel = { overdue: -400, today: -300, soon: -150, normal: 0, none: 400 };
  score += byLevel[urg.level] ?? 0;
  if (action.needsSignoff) score -= 60; // sign-off is a fast, high-leverage action
  if (typeof urg.days === "number") score += urg.days; // tie-break by ETA
  return score;
}

/* Is this action actionable by the current user? Drives "Needs me".      */
export function actionableByMe(action, { roles = [], hasSignoff = false } = {}) {
  if (!action || action.external || action.owner === "none") return false;
  if (action.needsSignoff) return hasSignoff;
  const o = OWNERS[action.owner];
  if (!o) return false;
  if (o.kind === "role") return roles.includes(o.role);
  if (o.kind === "signoff") return hasSignoff;
  return false;
}

export const ownerLabel = (owner) => OWNERS[owner]?.label || "—";
