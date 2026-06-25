import { dutyRateForHs, treatmentByKey, simaScreen, ogdScreen } from "../reference/referenceData.js";

/* ------------------------------------------------------------------ */
/*  Classification proposal engine.                                    */
/*  Maps a line description to a candidate HS heading and the GRI path  */
/*  used, then GROUNDS the duty rate and treatment against reference    */
/*  data. The model "proposes"; this engine stands in for that draft in */
/*  the prototype. It never finalizes — a specialist commits the code.  */
/*                                                                      */
/*  Duty/treatment values are not literals here; they resolve through    */
/*  referenceData so a tariff change is a data edit, not a code change.  */
/* ------------------------------------------------------------------ */

const RULES = [
  { k: ["hydraulic pump"], hs: "8413.60.10.00", h: "Rotary positive-displacement pumps for liquids", conf: 0.91, gri: "GRI 1", notes: "Heading 84.13 covers pumps for liquids; rotary positive-displacement sub-heading by mechanism." },
  { k: ["hydraulic cylinder", "actuator", "cylinder"], hs: "8412.21.00.10", h: "Hydraulic power engines and motors, linear acting", conf: 0.87, gri: "GRI 1", notes: "Heading 84.12; linear-acting hydraulic units classified as cylinders." },
  { k: ["ring joint", "rtj", "ring-type joint"], hs: "8484.10.00.00", h: "Gaskets/seals of metal sheeting with other material", conf: 0.74, gri: "GRI 1", notes: "Heading 84.84. Metallic vs. composite ring-joint must be confirmed to fix the statistical suffix." },
  { k: ["gasket", "seal", "o-ring", "oring"], hs: "8484.90.00.00", h: "Sets/assortments of gaskets and similar joints", conf: 0.71, gri: "GRI 1", notes: "Heading 84.84. Composition (metal / rubber / PTFE) drives the sub-heading; not stated." },
  { k: ["ball valve", "gate valve", "check valve", "globe valve", "solenoid valve", "valve"], hs: "8481.80.00.90", h: "Taps, cocks, valves for pipes, tanks", conf: 0.86, gri: "GRI 1", notes: "Heading 84.81 covers appliances for controlling flow in piping." },
  { k: ["ball bearing", "roller bearing", "bearing"], hs: "8482.10.00.90", h: "Ball or roller bearings", conf: 0.9, gri: "GRI 1", notes: "Heading 84.82 names ball/roller bearings expressly." },
  { k: ["grease", "lubricant", "lubricating"], hs: "3403.19.00.90", h: "Lubricating preparations", conf: 0.82, gri: "GRI 1", notes: "Heading 34.03. Confirm <70% petroleum-oil content vs. Ch. 27." },
  { k: ["electric motor", "motor"], hs: "8501.52.20.00", h: "AC motors, multi-phase, output > 750 W ≤ 75 kW", conf: 0.69, gri: "GRI 1", notes: "Heading 85.01. Power output (kW) governs the sub-heading and is not on the invoice.", missingSpec: "motor output in kW" },
  { k: ["filter element", "hydraulic filter", "filter"], hs: "8421.29.00.90", h: "Filtering/purifying machinery for liquids", conf: 0.79, gri: "GRI 1", notes: "Heading 84.21. Distinguish complete apparatus vs. parts (84.21.99) if a cartridge only." },
  { k: ["flange"], hs: "7307.91.00.90", h: "Flanges of iron or steel", conf: 0.81, gri: "GRI 1", notes: "Heading 73.07; flanges named at sub-heading." },
  { k: ["coupling", "shaft"], hs: "8483.60.00.90", h: "Clutches and shaft couplings", conf: 0.7, gri: "GRI 1", notes: "Heading 84.83. Mechanical vs. flexible coupling can shift the suffix." },
  { k: ["fitting", "elbow", "tee", "reducer", "nipple"], hs: "7307.99.00.90", h: "Tube or pipe fittings of iron or steel", conf: 0.8, gri: "GRI 1", notes: "Heading 73.07. Cast vs. wrought and material grade affect classification." },
  { k: ["bolt", "screw", "nut", "washer", "fastener", "stud"], hs: "7318.15.00.90", h: "Threaded screws and bolts of iron or steel", conf: 0.85, gri: "GRI 1", notes: "Heading 73.18 names screws/bolts of iron or steel." },
  { k: ["hose"], hs: "4009.31.00.00", h: "Tubes/pipes of vulcanised rubber, textile-reinforced", conf: 0.72, gri: "GRI 1", notes: "Heading 40.09. Reinforcement type sets the sub-heading.", missingSpec: "hose reinforcement type" },
  { k: ["pipe", "tube", "tubing"], hs: "7306.30.00.90", h: "Other welded tubes/pipes of iron or non-alloy steel", conf: 0.74, gri: "GRI 1", notes: "Ch. 73. Welded vs. seamless and alloy content change the heading.", missingSpec: "welded vs. seamless; alloy content" },
  { k: ["cable", "wire", "conductor"], hs: "8544.49.90.90", h: "Other insulated electric conductors", conf: 0.77, gri: "GRI 1", notes: "Heading 85.44. Voltage rating and connectors fitted affect the sub-heading." },
  { k: ["transmitter", "pressure sensor", "sensor", "gauge"], hs: "9026.20.00.90", h: "Instruments for measuring pressure of liquids/gases", conf: 0.72, gri: "GRI 1", notes: "Heading 90.26. Measured variable (pressure/flow/level) must be confirmed.", missingSpec: "measured variable" },
  { k: ["circuit board", "pcb", "controller", "control board"], hs: "8537.10.99.90", h: "Boards/panels for electric control, ≤ 1000 V", conf: 0.66, gri: "GRI 1 / GRI 3(b)", notes: "Possible 85.37 vs. 85.34 (bare PCB) vs. 84.xx (part of a machine). Function decides.", missingSpec: "board function" },
  { k: ["glove", "helmet", "hard hat", "safety", "ppe", "respirator"], hs: "—", h: "PPE — heading depends on material and function", conf: 0.4, gri: "GRI 3(b)", notes: "No single heading. Gloves/eye-face/respiratory split across Ch. 39/40/61/62/90 by material and use.", missingSpec: "material & construction (coated/knit/supported)" },
  { k: ["pump"], hs: "8413.70.00.90", h: "Other centrifugal pumps", conf: 0.7, gri: "GRI 1", notes: "Heading 84.13. Pump type (centrifugal/reciprocating) sets the sub-heading.", missingSpec: "pump type" },
];

export const CLEAR_THRESHOLD = 0.8;
export const isCleared = (conf) => conf >= CLEAR_THRESHOLD;

/* Whole-word match so short keywords don't collide inside other words   */
/* (e.g. "tee" must not match inside "steel").                            */
function kwMatch(text, kw) {
  const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${esc}\\b`, "i").test(text);
}

function matchRule(desc) {
  const d = (desc || "").toLowerCase();
  for (const rule of RULES) {
    if (rule.k.some((kw) => kwMatch(d, kw))) return rule;
  }
  return null;
}

/* Determine the tariff treatment from origin, grounded in reference data. */
function determineTreatment(origin) {
  const o = (origin || "").toLowerCase();
  if (o.includes("united states") || o === "usa" || o === "us") {
    return { ...treatmentByKey("CUSMA-US"), basis: "Origin US; CUSMA claimable with valid certification of origin." };
  }
  if (o.includes("mexico")) {
    return { ...treatmentByKey("CUSMA-MX"), basis: "Origin Mexico; CUSMA claimable with valid certification of origin." };
  }
  const mfn = treatmentByKey("MFN");
  return { ...mfn, basis: `Origin ${origin || "unstated"}; defaulting to MFN. Confirm GPT/LDCT eligibility if applicable.` };
}

/* The core proposal. Returns a structured draft, grounded where possible. */
export function proposeClassification(line) {
  const desc = line?.description || "";
  const rule = matchRule(desc);
  const treatment = determineTreatment(line?.origin);

  if (!rule) {
    return {
      hs: "—",
      heading: "Unclassified — insufficient detail",
      candidates: [],
      gri: "GRI 1 / GRI 3",
      notes:
        "The description lacks the material, function, or composition needed to apply GRI 1; an essential-character analysis (GRI 3) may be required once specs are supplied.",
      confidence: 0.34,
      lowReason: "No matching heading from the description provided.",
      missingSpec: "material, function, or composition",
      treatment,
      duty: null,
      grounded: false,
      sima: [],
      ogd: [],
    };
  }

  const duty = dutyRateForHs(rule.hs);
  const sima = simaScreen(rule.hs, line?.origin);
  const ogd = ogdScreen(desc, rule.hs);
  const lowReason = rule.conf < CLEAR_THRESHOLD
    ? rule.missingSpec
      ? `Deciding spec missing: ${rule.missingSpec}.`
      : "Heading is contestable; specialist review required."
    : null;

  return {
    hs: rule.hs,
    heading: rule.h,
    candidates: [{ hs: rule.hs, heading: rule.h, conf: rule.conf }],
    gri: rule.gri,
    notes: rule.notes,
    confidence: rule.conf,
    lowReason,
    missingSpec: rule.missingSpec || null,
    treatment,
    duty, // {rate, note, source} or null when ungrounded
    grounded: !!duty || rule.hs !== "—",
    sima,
    ogd,
  };
}

/* Ranked candidates for the (future) lookup tool / assistant. */
export function candidates(query, n = 4) {
  const d = (query || "").toLowerCase().trim();
  if (!d) return [];
  return RULES.map((rule) => {
    let score = 0;
    for (const kw of rule.k) {
      if (kwMatch(d, kw)) score += kw.split(" ").length * 2 + kw.length / 12;
      else if (kw.split(" ").some((w) => w.length > 3 && kwMatch(d, w))) score += 0.5;
    }
    return { rule, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ rule }) => ({ hs: rule.hs, heading: rule.h, conf: rule.conf, gri: rule.gri, notes: rule.notes }));
}
