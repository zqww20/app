/* ------------------------------------------------------------------ */
/*  Design tokens — a calm, official, enterprise palette.              */
/*  Public Sans (the US government design-system typeface) for UI,      */
/*  IBM Plex Mono for codes, references and figures. Cool neutral ramp, */
/*  one confident accent, and status colours that carry meaning only.   */
/* ------------------------------------------------------------------ */

/* Cool neutral ramp — the backbone of the whole interface. */
export const GRAY = {
  25: "#FBFCFD",
  50: "#F5F7FA",
  100: "#EEF1F5",
  150: "#E8ECF1",
  200: "#E2E7ED",
  300: "#CFD6DF",
  400: "#97A1AF",
  500: "#6B7686",
  600: "#4E5A6A",
  700: "#37424F",
  800: "#232C38",
  900: "#151C26",
};

export const C = {
  paper: GRAY[50],
  panel: "#FFFFFF",
  panelAlt: "#F8FAFC",
  ink: GRAY[900],
  sub: GRAY[600],
  faint: GRAY[400],
  line: GRAY[200],
  lineSoft: GRAY[100],

  // accent — a confident, slightly navy azure
  accent: "#1F5BA6",
  accentStrong: "#19497F",
  accentBg: "#EAF1F8",
  accentLine: "#C9DCEE",

  // operational status
  good: "#157A52",
  goodBg: "#E7F3EC",
  goodLine: "#C6E3D2",
  warn: "#8C5E0A",
  warnBg: "#FAF1DD",
  warnLine: "#EBD9B2",
  alert: "#B42318",
  alertBg: "#FBEAE8",
  alertLine: "#F1C9C4",

  muted: GRAY[500],
  mutedBg: GRAY[100],
};

export const SANS = "'Public Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const MONO = "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace";

/* Elevation — used sparingly so panels read as paper, not plastic. */
export const SHADOW = {
  xs: "0 1px 2px rgba(20,28,38,0.05)",
  sm: "0 1px 2px rgba(20,28,38,0.04), 0 1px 3px rgba(20,28,38,0.05)",
  md: "0 4px 14px rgba(20,28,38,0.08)",
  lg: "0 14px 34px rgba(20,28,38,0.14)",
};

export const RADIUS = { sm: 6, md: 8, lg: 10, pill: 999 };

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
