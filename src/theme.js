/* ------------------------------------------------------------------ */
/*  Visual tokens. Unbranded and operational: a neutral paper/ink        */
/*  palette tuned for legibility and dense, all-day work. Mono for       */
/*  codes, references and labels; sans for prose. No brand colour —      */
/*  accent is reserved for primary actions; red/amber/green carry        */
/*  operational meaning only (blocked / attention / clear).              */
/* ------------------------------------------------------------------ */

export const C = {
  paper: "#F3F4F6",
  panel: "#FFFFFF",
  panelAlt: "#FAFBFC",
  ink: "#1A2330",
  sub: "#586271",
  faint: "#8A93A0",
  line: "#E3E7EC",
  lineSoft: "#EEF0F3",
  accent: "#2C5A86", // primary actions (desaturated blue)
  accentBg: "#E9F0F6",
  accentLine: "#CBDCEA",
  good: "#1C7A52",
  goodBg: "#E9F2EC",
  goodLine: "#CDE5D7",
  warn: "#9A6516",
  warnBg: "#F7EFE1",
  warnLine: "#EAD8B6",
  alert: "#A33034",
  alertBg: "#F7E9EA",
  alertLine: "#E6C9CB",
  muted: "#6B7480",
  mutedBg: "#EEF0F3",
};

export const SANS = "'IBM Plex Sans', system-ui, -apple-system, sans-serif";
export const MONO = "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace";

/* state tone → colours (tones come from domain/constants STATES) */
export const TONE = {
  neutral: { color: C.muted, bg: C.mutedBg, line: C.line },
  info: { color: C.accent, bg: C.accentBg, line: C.accentLine },
  warn: { color: C.warn, bg: C.warnBg, line: C.warnLine },
  good: { color: C.good, bg: C.goodBg, line: C.goodLine },
  alert: { color: C.alert, bg: C.alertBg, line: C.alertLine },
  muted: { color: C.muted, bg: C.mutedBg, line: C.line },
};

export const toneOf = (t) => TONE[t] || TONE.neutral;
