/* ------------------------------------------------------------------ */
/*  Manifest design tokens                                             */
/*  A bureaucratic-document aesthetic: paper, ink, customs-stamp red.  */
/*  Mono for codes & labels, sans for prose. Shared across all views   */
/*  so inline-styled components and Tailwind utilities stay in sync.   */
/* ------------------------------------------------------------------ */

export const C = {
  paper: "#F4F5F7",
  panel: "#FFFFFF",
  panelAlt: "#FAFBFC",
  ink: "#16212E",
  sub: "#5B6776",
  faint: "#8A93A0",
  line: "#E2E6EC",
  lineSoft: "#EDEFF2",
  stamp: "#8A2F33",
  stampSoft: "#F3E7E8",
  green: "#1C7A52",
  greenBg: "#E9F2EC",
  greenLine: "#CDE5D7",
  amber: "#A8671C",
  amberBg: "#F7EFE1",
  amberLine: "#ECD9B8",
  blue: "#2C5A86",
  blueBg: "#E8EFF6",
  blueLine: "#CBDCEA",
};

export const SANS = "'IBM Plex Sans', system-ui, -apple-system, sans-serif";
export const MONO = "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace";

/* Status vocabulary shared by entries, line items, and broker review. */
export const STATUS = {
  intake: { label: "Intake", color: C.sub, bg: "#EEF0F3", line: C.line },
  classifying: { label: "Classifying", color: C.blue, bg: C.blueBg, line: C.blueLine },
  review: { label: "Broker review", color: C.amber, bg: C.amberBg, line: C.amberLine },
  staged: { label: "Staged to file", color: C.green, bg: C.greenBg, line: C.greenLine },
  filed: { label: "Filed", color: C.green, bg: C.greenBg, line: C.greenLine },
  hold: { label: "On hold", color: C.stamp, bg: C.stampSoft, line: "#E4C6C8" },
};

export function statusOf(key) {
  return STATUS[key] || STATUS.intake;
}
