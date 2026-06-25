/* ------------------------------------------------------------------ */
/*  Mock HS classification engine                                      */
/*  ILLUSTRATIVE ONLY — demonstrates the AI-propose / broker-confirm   */
/*  workflow. Codes are not customs advice. Ordered most-specific      */
/*  first so a "hydraulic pump" matches before a bare "pump".          */
/* ------------------------------------------------------------------ */

export const RULES = [
  { k: ["hydraulic pump"], hs: "8413.60.10.00", h: "Rotary positive-displacement pumps for liquids", t: "MFN / CUSMA", r: 0, conf: 0.91, g: "GRI 1 — heading 84.13 covers pumps for liquids; rotary positive-displacement sub-heading by mechanism." },
  { k: ["hydraulic cylinder", "actuator", "cylinder"], hs: "8412.21.00.10", h: "Hydraulic power engines and motors, linear acting (cylinders)", t: "MFN / CUSMA", r: 0, conf: 0.87, g: "GRI 1 — heading 84.12; linear-acting hydraulic units classified as cylinders." },
  { k: ["ring joint", "rtj", "ring-type joint"], hs: "8484.10.00.00", h: "Gaskets/seals of metal sheeting combined with other material", t: "MFN / CUSMA", r: 0, conf: 0.74, g: "GRI 1 — heading 84.84 (gaskets/seals). Metallic vs. composite ring-joint must be confirmed to fix the statistical suffix." },
  { k: ["gasket", "seal", "o-ring", "oring"], hs: "8484.90.00.00", h: "Sets/assortments of gaskets and similar joints", t: "MFN / CUSMA", r: 0, conf: 0.71, g: "GRI 1 — heading 84.84. Composition (metal / rubber / PTFE) drives sub-heading; not stated, so flagged." },
  { k: ["ball valve", "gate valve", "check valve", "globe valve", "solenoid valve", "valve"], hs: "8481.80.00.90", h: "Taps, cocks, valves for pipes, boiler shells, tanks", t: "MFN / CUSMA", r: 0, conf: 0.86, g: "GRI 1 — heading 84.81 covers appliances for controlling flow in piping." },
  { k: ["ball bearing", "roller bearing", "bearing"], hs: "8482.10.00.90", h: "Ball or roller bearings", t: "MFN / CUSMA", r: 0, conf: 0.9, g: "GRI 1 — heading 84.82 names ball/roller bearings expressly." },
  { k: ["grease", "lubricant", "lubricating"], hs: "3403.19.00.90", h: "Lubricating preparations", t: "MFN / CUSMA", r: 0, conf: 0.82, g: "GRI 1 — heading 34.03 (lubricating preparations). Confirm <70% petroleum-oil content vs. Ch. 27." },
  { k: ["electric motor", "motor"], hs: "8501.52.20.00", h: "AC motors, multi-phase, output > 750 W ≤ 75 kW", t: "MFN / CUSMA", r: 0, conf: 0.69, g: "GRI 1 — heading 85.01. Power output (kW) governs the sub-heading and is not on the invoice — review." },
  { k: ["filter element", "hydraulic filter", "filter"], hs: "8421.29.00.90", h: "Filtering/purifying machinery for liquids", t: "MFN / CUSMA", r: 0, conf: 0.79, g: "GRI 1 — heading 84.21. Distinguish complete apparatus vs. parts (84.21.99) if a cartridge only." },
  { k: ["flange"], hs: "7307.91.00.90", h: "Flanges of iron or steel", t: "MFN / CUSMA", r: 0, conf: 0.81, g: "GRI 1 — heading 73.07 (tube/pipe fittings); flanges named at sub-heading." },
  { k: ["coupling", "shaft"], hs: "8483.60.00.90", h: "Clutches and shaft couplings", t: "MFN / CUSMA", r: 0, conf: 0.7, g: "GRI 1 — heading 84.83. Mechanical vs. flexible coupling can shift the suffix — review." },
  { k: ["fitting", "elbow", "tee", "reducer", "nipple"], hs: "7307.99.00.90", h: "Tube or pipe fittings of iron or steel", t: "MFN / CUSMA", r: 0, conf: 0.8, g: "GRI 1 — heading 73.07. Cast vs. wrought and material grade affect classification." },
  { k: ["bolt", "screw", "nut", "washer", "fastener", "stud"], hs: "7318.15.00.90", h: "Threaded screws and bolts of iron or steel", t: "MFN / CUSMA", r: 0, conf: 0.85, g: "GRI 1 — heading 73.18 names screws/bolts of iron or steel." },
  { k: ["hose"], hs: "4009.31.00.00", h: "Tubes/pipes of vulcanised rubber, textile-reinforced", t: "MFN / CUSMA", r: 0, conf: 0.72, g: "GRI 1 — heading 40.09 (rubber hose). Reinforcement type sets the sub-heading; verify." },
  { k: ["pipe", "tube", "tubing"], hs: "7306.30.00.90", h: "Other welded tubes/pipes of iron or non-alloy steel", t: "MFN / CUSMA", r: 0, conf: 0.74, g: "GRI 1 — Ch. 73. Welded vs. seamless and alloy content change the heading — review." },
  { k: ["cable", "wire", "conductor"], hs: "8544.49.90.90", h: "Other insulated electric conductors", t: "MFN / CUSMA", r: 0, conf: 0.77, g: "GRI 1 — heading 85.44. Voltage rating and connectors fitted affect the sub-heading." },
  { k: ["transmitter", "pressure sensor", "sensor", "gauge"], hs: "9026.20.00.90", h: "Instruments for measuring pressure of liquids/gases", t: "MFN / CUSMA", r: 0, conf: 0.72, g: "GRI 1 — heading 90.26. Measured variable (pressure/flow/level) must be confirmed." },
  { k: ["circuit board", "pcb", "controller", "control board"], hs: "8537.10.99.90", h: "Boards/panels for electric control, ≤ 1000 V", t: "MFN / CUSMA", r: 0, conf: 0.66, g: "Possible 85.37 vs. 85.34 (bare PCB) vs. 84.xx (part of a machine). Function decides — review." },
  { k: ["glove", "helmet", "safety", "ppe", "respirator"], hs: "—", h: "PPE — classification depends on material and function", t: "—", r: null, conf: 0.4, g: "No single heading. Gloves, eye/face, and respiratory protection split across Ch. 39/40/61/62/90 by material and use. Manual classification required." },
  { k: ["pump"], hs: "8413.70.00.90", h: "Other centrifugal pumps", t: "MFN / CUSMA", r: 0, conf: 0.7, g: "GRI 1 — heading 84.13. Pump type (centrifugal / reciprocating) sets the sub-heading; assumed centrifugal — review." },
];

export function classify(desc) {
  const d = (desc || "").toLowerCase();
  for (const rule of RULES) {
    if (rule.k.some((kw) => d.includes(kw))) {
      // strip the internal keyword list before returning
      const { k, ...rest } = rule;
      return rest;
    }
  }
  return {
    hs: "—",
    h: "Unclassified — insufficient detail",
    t: "—",
    r: null,
    conf: 0.34,
    g: "Manual classification required. The description lacks the material, function, or composition needed to apply GRI 1; an essential-character analysis (GRI 3) may be required once specs are supplied.",
  };
}

/* Return the top N candidate headings for a free-text query — used by  */
/* the Tariff Lookup tool to show alternatives, not just one answer.     */
export function candidates(query, n = 4) {
  const d = (query || "").toLowerCase().trim();
  if (!d) return [];
  const scored = RULES.map((rule) => {
    let score = 0;
    for (const kw of rule.k) {
      if (d.includes(kw)) score += kw.split(" ").length * 2 + kw.length / 12;
      else if (kw.split(" ").some((w) => w.length > 3 && d.includes(w))) score += 0.5;
    }
    return { rule, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
  return scored.map(({ rule }) => {
    const { k, ...rest } = rule;
    return rest;
  });
}

export const CLEAR_THRESHOLD = 0.8;
export const isCleared = (conf) => conf >= CLEAR_THRESHOLD;
