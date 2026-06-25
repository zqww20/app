import { proposeClassification } from "../lib/classify.js";

/* ------------------------------------------------------------------ */
/*  Seed dataset for a mid-size Canadian brokerage clearing industrial   */
/*  / oilfield MRO goods. Demonstrates every checkpoint: a clean file    */
/*  ready for sign-off, an importer missing RPP security (blocks         */
/*  release), an expiring authority, a SIMA-exposed steel entry, and     */
/*  files already through release / accounting / archive.                */
/* ------------------------------------------------------------------ */

const BASE = Date.parse("2026-06-25T09:00:00");
const ago = (mins) => BASE - mins * 60000;

/* committed classification for an already-decided line */
function decided(line, by, at) {
  const p = proposeClassification(line);
  return {
    status: "accepted",
    hs: p.hs,
    heading: p.heading,
    gri: p.gri,
    treatmentKey: p.treatment?.key || null,
    treatmentCode: p.treatment?.code || null,
    confidence: p.confidence,
    decidedBy: by,
    decidedByName: "D. Achterberg",
    decidedAt: at,
    reason: null,
  };
}

export const SEED_USERS = [
  { id: "u_broker", name: "D. Achterberg", roles: ["classification_specialist", "compliance_advisor", "operations_manager"], signoff: true, licence: "CCS #18840", title: "Licensed customs broker" },
  { id: "u_clerk", name: "M. Okafor", roles: ["release_clerk"], signoff: false, title: "Release clerk" },
  { id: "u_classifier", name: "S. Lindqvist", roles: ["classification_specialist"], signoff: false, title: "Classification specialist" },
  { id: "u_accounting", name: "R. Patel", roles: ["accounting"], signoff: false, title: "Accounting / disbursement" },
  { id: "u_manager", name: "J. Tremblay", roles: ["operations_manager"], signoff: false, title: "Operations manager" },
];

export const SEED_IMPORTERS = [
  {
    id: "imp_vertex",
    legalName: "Vertex Energy Services Inc.",
    tradeNames: ["Vertex Energy"],
    businessNumber: "80114 5521",
    programAccount: "RM0001",
    ior: "Vertex Energy Services Inc., Calgary AB",
    agencyAuthority: { valid: true, type: "Agency agreement + GAA", expiry: "2027-03-31", signedBy: "Vertex Energy Services Inc." },
    rpp: { active: true, type: "Surety bond", amount: 250000, expiry: "2026-12-31" },
    carm: { registered: true, delegation: true },
    gstHst: "80114 5521 RT0001",
    defaultTreatments: ["CUSMA-US", "MFN"],
    commodities: [
      { keyword: "hydraulic pump", hs: "8413.60.10.00", heading: "Rotary positive-displacement pumps", lastSettled: "2026-02-11" },
      { keyword: "ball valve", hs: "8481.80.00.90", heading: "Taps, cocks, valves", lastSettled: "2026-03-02" },
    ],
    note: "Key account. Standing instruction: flag any non-US origin line that breaks an all-US CUSMA claim.",
  },
  {
    id: "imp_northpeak",
    legalName: "Northpeak Drilling Ltd.",
    tradeNames: [],
    businessNumber: "72290 8810",
    programAccount: "RM0001",
    ior: "Northpeak Drilling Ltd., Grande Prairie AB",
    agencyAuthority: { valid: true, type: "Agency agreement", expiry: "2026-11-30", signedBy: "Northpeak Drilling Ltd." },
    rpp: { active: true, type: "Cash deposit", amount: 60000, expiry: "2026-07-15" }, // expiring within 3 weeks
    carm: { registered: true, delegation: true },
    gstHst: "72290 8810 RT0001",
    defaultTreatments: ["MFN", "GPT"],
    commodities: [],
    note: "Mixed-origin spares. PPE shipments recurrently need manual classification. RPP security expires 15 Jul 2026 — renew.",
  },
  {
    id: "imp_cascade",
    legalName: "Cascade Process Supply Ltd.",
    tradeNames: ["Cascade"],
    businessNumber: "65512 1190",
    programAccount: "RM0001",
    ior: "Cascade Process Supply Ltd., Sherwood Park AB",
    agencyAuthority: { valid: true, type: "Agency agreement", expiry: "2026-07-02", signedBy: "Cascade Process Supply Ltd." }, // expiring in 1 week
    rpp: { active: true, type: "Surety bond", amount: 100000, expiry: "2027-01-31" },
    carm: { registered: true, delegation: true },
    gstHst: "65512 1190 RT0001",
    defaultTreatments: ["CUSMA-US", "MFN"],
    commodities: [{ keyword: "valve", hs: "8481.80.00.90", heading: "Taps, cocks, valves", lastSettled: "2026-01-19" }],
    note: "Valves and instrumentation. Agency agreement expires 2 Jul 2026 — renew before next release.",
  },
  {
    id: "imp_borealis",
    legalName: "Borealis Fabrication Corp.",
    tradeNames: [],
    businessNumber: "91037 4402",
    programAccount: "RM0001",
    ior: "Borealis Fabrication Corp., Nisku AB",
    agencyAuthority: { valid: true, type: "Agency agreement", expiry: "2027-05-31", signedBy: "Borealis Fabrication Corp." },
    rpp: { active: false, type: null, amount: null, expiry: null }, // NO security — blocks release
    carm: { registered: true, delegation: false }, // delegation missing
    gstHst: "91037 4402 RT0001",
    defaultTreatments: ["MFN"],
    commodities: [],
    note: "Onboarded this quarter. No RPP financial security on file and CARM delegation of authority not yet granted — both block release readiness.",
  },
];

/* line factory */
let lc = 0;
const L = (o) => ({ id: `ln_${++lc}`, source_field: null, material: null, ...o });

export const SEED_SHIPMENTS = [
  /* ready for broker sign-off — the clean happy path */
  {
    id: "shp_0138",
    no: "SHP-26-0138",
    importerId: "imp_cascade",
    supplier: "Lone Star Instrument Supply",
    exporter: "Lone Star Instrument Supply, Houston TX",
    originCountry: "United States",
    shipTo: "Cascade Process Supply, Sherwood Park AB",
    mode: "Air",
    port: "Calgary, AB (706)",
    incoterm: "CIP Calgary",
    etaDate: "2026-06-24",
    createdAt: ago(60 * 30),
    state: "pending_release_signoff",
    assigned: "u_broker",
    documents: [
      { id: "d1", type: "commercial_invoice", name: "INV-LS-44821.pdf", version: 1, addedAt: ago(60 * 30) },
      { id: "d2", type: "certificate_of_origin", name: "CUSMA-cert.pdf", version: 1, addedAt: ago(60 * 29) },
      { id: "d3", type: "air_waybill", name: "AWB-014-88...pdf", version: 1, addedAt: ago(60 * 29) },
    ],
    intake: { headerConfirmed: true, linesConfirmed: true, confirmedBy: "u_clerk", confirmedAt: ago(60 * 26) },
    valuation: { method: "transaction_value", reviewedBy: "u_broker" },
    assessment: { reviewed: true, reviewedBy: "u_broker" },
    release: { stream: "RMD", transmitted: false },
    accounting: {},
    billing: {},
    lines: [
      { ...L({ description: "Pressure transmitter, 0-300 PSI, 4-20mA", quantity: 6, unit_price: 410, currency: "USD", origin: "United States" }), classification: decided({ description: "Pressure transmitter, 0-300 PSI, 4-20mA", origin: "United States" }, "u_broker", ago(60 * 27)) },
      { ...L({ description: "316 SS ball valve, 1 inch, threaded", quantity: 20, unit_price: 52, currency: "USD", origin: "United States", material: "Stainless steel 316" }), classification: decided({ description: "316 SS ball valve, 1 inch, threaded", origin: "United States" }, "u_broker", ago(60 * 27)) },
      { ...L({ description: "Stainless steel pipe fitting, elbow 90deg, 1 inch", quantity: 35, unit_price: 8.9, currency: "USD", origin: "United States", material: "Stainless steel" }), classification: decided({ description: "Stainless steel pipe fitting, elbow 90deg, 1 inch", origin: "United States" }, "u_broker", ago(60 * 27)) },
    ],
  },

  /* in classification — Vertex, one India-origin line breaks CUSMA */
  {
    id: "shp_0142",
    no: "SHP-26-0142",
    importerId: "imp_vertex",
    supplier: "Permian Fluid Power Inc.",
    exporter: "Permian Fluid Power Inc., Houston TX",
    originCountry: "United States",
    shipTo: "Vertex Energy Services, Calgary AB",
    mode: "Truck",
    port: "Coutts, AB (705)",
    incoterm: "FCA Houston",
    etaDate: "2026-06-25",
    createdAt: ago(60 * 8),
    state: "in_classification",
    assigned: "u_classifier",
    documents: [
      { id: "d1", type: "commercial_invoice", name: "INV-PFP-7741.pdf", version: 1, addedAt: ago(60 * 8) },
      { id: "d2", type: "certificate_of_origin", name: "CUSMA-cert.pdf", version: 1, addedAt: ago(60 * 8) },
      { id: "d3", type: "packing_list", name: "PL-7741.pdf", version: 1, addedAt: ago(60 * 8) },
    ],
    intake: { headerConfirmed: true, linesConfirmed: true, confirmedBy: "u_clerk", confirmedAt: ago(60 * 7) },
    valuation: {},
    assessment: {},
    release: {},
    accounting: {},
    billing: {},
    lines: [
      { ...L({ description: "Hydraulic gear pump, cast iron body, 25 GPM", quantity: 4, unit_price: 312.5, currency: "USD", origin: "United States", material: "Cast iron / steel" }), classification: decided({ description: "Hydraulic gear pump, cast iron body, 25 GPM", origin: "United States" }, "u_classifier", ago(60 * 6)) },
      L({ description: "316 SS ball valve, 2 inch, flanged", quantity: 12, unit_price: 88, currency: "USD", origin: "United States", material: "Stainless steel 316" }),
      L({ description: "Ring joint gasket R-37, soft iron", quantity: 50, unit_price: 6.4, currency: "USD", origin: "India", material: null }),
      L({ description: "Hydraulic filter element, 10 micron", quantity: 18, unit_price: 22.75, currency: "USD", origin: "United States" }),
    ],
  },

  /* in intake — Northpeak, China PPE awaiting clerk confirmation */
  {
    id: "shp_0145",
    no: "SHP-26-0145",
    importerId: "imp_northpeak",
    supplier: "Guangzhou Safesource Trading Co.",
    exporter: "Guangzhou Safesource Trading Co., Guangzhou",
    originCountry: "China",
    shipTo: "Northpeak Drilling, Grande Prairie AB",
    mode: "Ocean",
    port: "Vancouver, BC (809)",
    incoterm: "FOB Yantian",
    etaDate: "2026-06-27",
    createdAt: ago(60 * 5),
    state: "in_intake",
    assigned: "u_clerk",
    documents: [
      { id: "d1", type: "commercial_invoice", name: "INV-GST-2231.pdf", version: 1, addedAt: ago(60 * 5) },
      { id: "d2", type: "bill_of_lading", name: "BOL-COSU....pdf", version: 1, addedAt: ago(60 * 5) },
    ],
    intake: { headerConfirmed: false, linesConfirmed: false, extracted: true },
    valuation: {},
    assessment: {},
    release: {},
    accounting: {},
    billing: {},
    lines: [
      L({ description: "Nitrile safety gloves, cut-resistant, size L", quantity: 200, unit_price: 1.25, currency: "USD", origin: "China", material: "Nitrile", source_field: "Line 1 — 'Nitrile glove cut 5 L'" }),
      L({ description: "Hard hat, vented, ratchet suspension", quantity: 60, unit_price: 4.8, currency: "USD", origin: "China", material: "HDPE", source_field: "Line 2 — 'Safety helmet vented'" }),
      L({ description: "Steel hex bolt assortment, grade 8.8, zinc", quantity: 40, unit_price: 14.2, currency: "USD", origin: "China", material: "Carbon steel", source_field: "Line 3 — 'Hex bolt 8.8 ZP asst'" }),
    ],
  },

  /* in assessment — Borealis India steel: SIMA exposure + importer blocks */
  {
    id: "shp_0149",
    no: "SHP-26-0149",
    importerId: "imp_borealis",
    supplier: "Tata Steel Processing (via Rotterdam)",
    exporter: "Tata Steel Processing, Jamshedpur",
    originCountry: "India",
    shipTo: "Borealis Fabrication, Nisku AB",
    mode: "Ocean",
    port: "Montreal, QC (395)",
    incoterm: "CFR Montreal",
    etaDate: "2026-06-30",
    createdAt: ago(60 * 20),
    state: "in_assessment",
    assigned: "u_broker",
    documents: [
      { id: "d1", type: "commercial_invoice", name: "INV-TSP-9012.pdf", version: 1, addedAt: ago(60 * 20) },
      { id: "d2", type: "other", name: "Mill-test-cert.pdf", version: 1, addedAt: ago(60 * 20) },
    ],
    intake: { headerConfirmed: true, linesConfirmed: true, confirmedBy: "u_clerk", confirmedAt: ago(60 * 19) },
    valuation: { method: "transaction_value", reviewedBy: "u_broker" },
    assessment: { reviewed: false },
    release: {},
    accounting: {},
    billing: {},
    lines: [
      { ...L({ description: "Welded carbon steel pipe, ERW, 4 inch sch 40", quantity: 120, unit_price: 41.5, currency: "USD", origin: "India", material: "Carbon steel" }), classification: decided({ description: "Welded carbon steel pipe, ERW, 4 inch sch 40", origin: "India" }, "u_broker", ago(60 * 18)) },
      { ...L({ description: "Weld neck flange, 4 inch, 150#, forged", quantity: 24, unit_price: 27.8, currency: "USD", origin: "India", material: "Forged steel" }), classification: decided({ description: "Weld neck flange, 4 inch, 150#, forged", origin: "India" }, "u_broker", ago(60 * 18)) },
    ],
  },

  /* released — Vertex, already through */
  {
    id: "shp_0131",
    no: "SHP-26-0131",
    importerId: "imp_vertex",
    supplier: "Permian Fluid Power Inc.",
    exporter: "Permian Fluid Power Inc., Houston TX",
    originCountry: "United States",
    shipTo: "Vertex Energy Services, Calgary AB",
    mode: "Truck",
    port: "Coutts, AB (705)",
    incoterm: "FCA Houston",
    etaDate: "2026-06-23",
    createdAt: ago(60 * 60),
    state: "released",
    assigned: "u_broker",
    documents: [
      { id: "d1", type: "commercial_invoice", name: "INV-PFP-7702.pdf", version: 1, addedAt: ago(60 * 60) },
      { id: "d2", type: "certificate_of_origin", name: "CUSMA-cert.pdf", version: 1, addedAt: ago(60 * 60) },
    ],
    intake: { headerConfirmed: true, linesConfirmed: true, confirmedBy: "u_clerk", confirmedAt: ago(60 * 58) },
    valuation: { method: "transaction_value", reviewedBy: "u_broker" },
    assessment: { reviewed: true, reviewedBy: "u_broker" },
    release: { stream: "PARS", transmitted: true, cbsaRef: "REL-704221", transmittedAt: ago(60 * 50), signedBy: "u_broker" },
    accounting: {},
    billing: {},
    lines: [
      { ...L({ description: "Hydraulic cylinder, 3 inch bore, double-acting", quantity: 8, unit_price: 268, currency: "USD", origin: "United States", material: "Steel" }), classification: decided({ description: "Hydraulic cylinder, 3 inch bore, double-acting", origin: "United States" }, "u_broker", ago(60 * 55)) },
      { ...L({ description: "Lubricating grease, lithium complex, 400g cartridge", quantity: 48, unit_price: 9.15, currency: "USD", origin: "United States" }), classification: decided({ description: "Lubricating grease, lithium complex, 400g cartridge", origin: "United States" }, "u_broker", ago(60 * 55)) },
      { ...L({ description: "Ball bearing, deep groove, 6205-2RS", quantity: 100, unit_price: 3.4, currency: "USD", origin: "United States" }), classification: decided({ description: "Ball bearing, deep groove, 6205-2RS", origin: "United States" }, "u_broker", ago(60 * 55)) },
    ],
  },

  /* accounted/billed — Vertex, further along */
  {
    id: "shp_0125",
    no: "SHP-26-0125",
    importerId: "imp_vertex",
    supplier: "Frontera Componentes S.A. de C.V.",
    exporter: "Frontera Componentes, Monterrey",
    originCountry: "Mexico",
    shipTo: "Vertex Energy Services, Calgary AB",
    mode: "Truck",
    port: "Coutts, AB (705)",
    incoterm: "FCA Monterrey",
    etaDate: "2026-06-18",
    createdAt: ago(60 * 120),
    state: "billed",
    assigned: "u_accounting",
    documents: [{ id: "d1", type: "commercial_invoice", name: "INV-FC-3310.pdf", version: 1, addedAt: ago(60 * 120) }],
    intake: { headerConfirmed: true, linesConfirmed: true, confirmedBy: "u_clerk", confirmedAt: ago(60 * 118) },
    valuation: { method: "transaction_value", reviewedBy: "u_broker" },
    assessment: { reviewed: true, reviewedBy: "u_broker" },
    release: { stream: "PARS", transmitted: true, cbsaRef: "REL-701884", transmittedAt: ago(60 * 110), signedBy: "u_broker" },
    accounting: { assembled: true, cadRef: "CAD-550118", submittedAt: ago(60 * 90), signedBy: "u_broker", revision: 0 },
    billing: { invoiced: true, invoiceNo: "BRK-26-0411", issuedAt: ago(60 * 80) },
    lines: [
      { ...L({ description: "AC electric motor, 3-phase, TEFC, 5 HP", quantity: 2, unit_price: 540, currency: "USD", origin: "Mexico" }), classification: decided({ description: "AC electric motor, 3-phase, TEFC, 5 HP", origin: "Mexico" }, "u_broker", ago(60 * 115)) },
      { ...L({ description: "Shaft coupling, jaw type, L-095", quantity: 16, unit_price: 18.5, currency: "USD", origin: "Mexico" }), classification: decided({ description: "Shaft coupling, jaw type, L-095", origin: "Mexico" }, "u_broker", ago(60 * 115)) },
    ],
  },

  /* awaiting documents — just created */
  {
    id: "shp_0150",
    no: "SHP-26-0150",
    importerId: "imp_northpeak",
    supplier: "Permian Fluid Power Inc.",
    exporter: "Permian Fluid Power Inc., Houston TX",
    originCountry: "United States",
    shipTo: "Northpeak Drilling, Grande Prairie AB",
    mode: "Truck",
    port: "Coutts, AB (705)",
    incoterm: "FCA Houston",
    etaDate: "2026-06-29",
    createdAt: ago(60 * 2),
    state: "awaiting_documents",
    assigned: null,
    documents: [],
    intake: { headerConfirmed: false, linesConfirmed: false },
    valuation: {},
    assessment: {},
    release: {},
    accounting: {},
    billing: {},
    lines: [],
  },
];

/* A small initial audit history so the log isn't empty on first load.   */
export const SEED_AUDIT = [
  { id: "a1", ts: ago(60 * 50), actor: "u_broker", actorName: "D. Achterberg", action: "release.transmitted", entity: "shipment", entityId: "shp_0131", field: "release", prior: "pending_release_signoff", next: "released", reason: "PARS release transmitted; CUSMA claimed on all lines.", signoff: true },
  { id: "a2", ts: ago(60 * 90), actor: "u_broker", actorName: "D. Achterberg", action: "accounting.cad_submitted", entity: "shipment", entityId: "shp_0125", field: "accounting", prior: null, next: "CAD-550118", reason: "CAD submitted within 5 business days of release.", signoff: true },
  { id: "a3", ts: ago(60 * 7), actor: "u_clerk", actorName: "M. Okafor", action: "intake.confirmed", entity: "shipment", entityId: "shp_0142", field: "intake", prior: null, next: "confirmed", reason: "Header and 4 lines verified against the commercial invoice." },
  { id: "a4", ts: ago(60 * 6), actor: "u_classifier", actorName: "S. Lindqvist", action: "classification.decided", entity: "line", entityId: "shp_0142/ln", field: "8413.60.10.00", prior: "proposed", next: "accepted", reason: "Accepted AI proposal; matches Vertex precedent from Feb 2026." },
];

export function buildSeed() {
  return {
    version: 3,
    users: SEED_USERS,
    importers: SEED_IMPORTERS,
    shipments: SEED_SHIPMENTS,
    audit: SEED_AUDIT,
    counters: { shipment: 150 },
  };
}
