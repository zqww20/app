/* ------------------------------------------------------------------ */
/*  Mock operational data for the Manifest workspace.                  */
/*  A mid-size brokerage clearing industrial / oilfield MRO goods into  */
/*  Canada. Day offsets are relative to "today" so the queue always     */
/*  looks live. HS codes are derived at render time via classify().     */
/* ------------------------------------------------------------------ */

export const BROKER = {
  name: "D. Achterberg",
  licence: "CCS #18840",
  role: "Licensed customs broker",
};

export const CLIENTS = [
  {
    id: "vertex",
    name: "Vertex Energy Services",
    ref: "BN 80114 5521 RM0001",
    country: "Canada",
    tier: "Key account",
    openEntries: 3,
    ytdEntries: 142,
    ytdDuty: 0,
    note: "PARS / CUSMA-eligible US machinery. Standing instruction: flag any non-US origin for marking review.",
  },
  {
    id: "northpeak",
    name: "Northpeak Drilling Ltd.",
    ref: "BN 72290 8810 RM0001",
    country: "Canada",
    tier: "Standard",
    openEntries: 2,
    ytdEntries: 67,
    ytdDuty: 14820.5,
    note: "Mixed-origin spares. PPE shipments recurrently need manual classification.",
  },
  {
    id: "cascade",
    name: "Cascade Process Supply",
    ref: "BN 65512 1190 RM0001",
    country: "Canada",
    tier: "Standard",
    openEntries: 1,
    ytdEntries: 38,
    ytdDuty: 5210.0,
    note: "Valves and instrumentation. Frequent partial shipments — watch for split invoices.",
  },
  {
    id: "borealis",
    name: "Borealis Fabrication",
    ref: "BN 91037 4402 RM0001",
    country: "Canada",
    tier: "New",
    openEntries: 1,
    ytdEntries: 4,
    ytdDuty: 980.25,
    note: "Onboarded this quarter. Steel goods — confirm CBSA surtax / SIMA exposure on each entry.",
  },
];

/* Each entry is one commercial invoice headed for a CBSA B3 entry.     */
export const ENTRIES = [
  {
    id: "ENT-24817",
    clientId: "vertex",
    supplier: "Permian Fluid Power Inc.",
    originCountry: "United States",
    mode: "Truck",
    port: "Coutts, AB (705)",
    incoterm: "FCA Houston",
    etaOffset: 0,
    createdOffset: -1,
    status: "review",
    assigned: "D. Achterberg",
    docs: ["Commercial invoice", "CUSMA certification of origin", "Packing list"],
    flags: [
      { level: "amber", text: "Line 3 origin (India) breaks the all-US CUSMA claim on this invoice — verify preferential treatment per line." },
    ],
    lines: [
      { description: "Hydraulic gear pump, cast iron body, 25 GPM", quantity: 4, unit_price: 312.5, currency: "USD", origin: "United States", material: "Cast iron / steel" },
      { description: "316 SS ball valve, 2 inch, flanged", quantity: 12, unit_price: 88.0, currency: "USD", origin: "United States", material: "Stainless steel 316" },
      { description: "Ring joint gasket R-37, soft iron", quantity: 50, unit_price: 6.4, currency: "USD", origin: "India", material: null },
      { description: "Hydraulic filter element, 10 micron", quantity: 18, unit_price: 22.75, currency: "USD", origin: "United States", material: null },
    ],
  },
  {
    id: "ENT-24820",
    clientId: "northpeak",
    supplier: "Guangzhou Safesource Trading Co.",
    originCountry: "China",
    mode: "Ocean",
    port: "Vancouver, BC (809)",
    incoterm: "FOB Yantian",
    etaOffset: 2,
    createdOffset: -1,
    status: "review",
    assigned: "D. Achterberg",
    docs: ["Commercial invoice", "Bill of lading"],
    flags: [
      { level: "amber", text: "Nitrile safety gloves have no single heading — manual classification required (Ch. 39/40/61 by material)." },
      { level: "stamp", text: "China origin: confirm MFN vs. any applicable surtax and that goods are not subject to a SIMA finding." },
    ],
    lines: [
      { description: "Nitrile safety gloves, cut-resistant, size L", quantity: 200, unit_price: 1.25, currency: "USD", origin: "China", material: "Nitrile" },
      { description: "Hard hat, vented, ratchet suspension", quantity: 60, unit_price: 4.8, currency: "USD", origin: "China", material: "HDPE" },
      { description: "Steel hex bolt assortment, grade 8.8, zinc", quantity: 40, unit_price: 14.2, currency: "USD", origin: "China", material: "Carbon steel" },
    ],
  },
  {
    id: "ENT-24809",
    clientId: "cascade",
    supplier: "Lone Star Instrument Supply",
    originCountry: "United States",
    mode: "Air",
    port: "Calgary, AB (706)",
    incoterm: "CIP Calgary",
    etaOffset: -1,
    createdOffset: -3,
    status: "staged",
    assigned: "D. Achterberg",
    docs: ["Commercial invoice", "CUSMA certification of origin", "Airway bill", "Packing list"],
    flags: [],
    lines: [
      { description: "Pressure transmitter, 0-300 PSI, 4-20mA", quantity: 6, unit_price: 410.0, currency: "USD", origin: "United States", material: null },
      { description: "316 SS ball valve, 1 inch, threaded", quantity: 20, unit_price: 52.0, currency: "USD", origin: "United States", material: "Stainless steel 316" },
      { description: "Stainless steel pipe fitting, elbow 90deg, 1 inch", quantity: 35, unit_price: 8.9, currency: "USD", origin: "United States", material: "Stainless steel" },
    ],
  },
  {
    id: "ENT-24822",
    clientId: "borealis",
    supplier: "Tata Steel Processing (via Rotterdam)",
    originCountry: "India",
    mode: "Ocean",
    port: "Montreal, QC (395)",
    incoterm: "CFR Montreal",
    etaOffset: 5,
    createdOffset: 0,
    status: "classifying",
    assigned: "Unassigned",
    docs: ["Commercial invoice", "Mill test certificate"],
    flags: [
      { level: "stamp", text: "Carbon-steel welded pipe from India — screen against active CBSA SIMA measures (anti-dumping / countervailing) before staging." },
    ],
    lines: [
      { description: "Welded carbon steel pipe, ERW, 4 inch sch 40", quantity: 120, unit_price: 41.5, currency: "USD", origin: "India", material: "Carbon steel" },
      { description: "Weld neck flange, 4 inch, 150#, forged", quantity: 24, unit_price: 27.8, currency: "USD", origin: "India", material: "Forged steel" },
    ],
  },
  {
    id: "ENT-24814",
    clientId: "vertex",
    supplier: "Permian Fluid Power Inc.",
    originCountry: "United States",
    mode: "Truck",
    port: "Coutts, AB (705)",
    incoterm: "FCA Houston",
    etaOffset: -2,
    createdOffset: -4,
    status: "filed",
    assigned: "D. Achterberg",
    docs: ["Commercial invoice", "CUSMA certification of origin", "Packing list", "B3 entry"],
    flags: [],
    lines: [
      { description: "Hydraulic cylinder, 3 inch bore, double-acting", quantity: 8, unit_price: 268.0, currency: "USD", origin: "United States", material: "Steel" },
      { description: "Lubricating grease, lithium complex, 400g cartridge", quantity: 48, unit_price: 9.15, currency: "USD", origin: "United States", material: null },
      { description: "Ball bearing, deep groove, 6205-2RS", quantity: 100, unit_price: 3.4, currency: "USD", origin: "United States", material: null },
    ],
  },
  {
    id: "ENT-24823",
    clientId: "vertex",
    supplier: "Frontera Componentes S.A. de C.V.",
    originCountry: "Mexico",
    mode: "Truck",
    port: "Coutts, AB (705)",
    incoterm: "FCA Monterrey",
    etaOffset: 3,
    createdOffset: 0,
    status: "intake",
    assigned: "Unassigned",
    docs: ["Commercial invoice"],
    flags: [],
    lines: [
      { description: "AC electric motor, 3-phase, TEFC, 5 HP", quantity: 2, unit_price: 540.0, currency: "USD", origin: "Mexico", material: null },
      { description: "Shaft coupling, jaw type, L-095", quantity: 16, unit_price: 18.5, currency: "USD", origin: "Mexico", material: null },
      { description: "Control board assembly, motor starter", quantity: 4, unit_price: 132.0, currency: "USD", origin: "Mexico", material: null },
    ],
  },
  {
    id: "ENT-24811",
    clientId: "cascade",
    supplier: "Lone Star Instrument Supply",
    originCountry: "United States",
    mode: "Air",
    port: "Calgary, AB (706)",
    incoterm: "CIP Calgary",
    etaOffset: 1,
    createdOffset: -2,
    status: "hold",
    assigned: "D. Achterberg",
    docs: ["Commercial invoice", "Airway bill"],
    flags: [
      { level: "stamp", text: "Held — CUSMA certification of origin not on file. Cannot claim preferential treatment until received from importer." },
    ],
    lines: [
      { description: "Solenoid valve, brass, 24VDC, 1/2 inch", quantity: 30, unit_price: 36.0, currency: "USD", origin: "United States", material: "Brass" },
      { description: "Insulated control cable, 4-conductor, 16 AWG", quantity: 500, unit_price: 1.1, currency: "USD", origin: "United States", material: "Copper / PVC" },
    ],
  },
  {
    id: "ENT-24825",
    clientId: "northpeak",
    supplier: "Permian Fluid Power Inc.",
    originCountry: "United States",
    mode: "Truck",
    port: "Coutts, AB (705)",
    incoterm: "FCA Houston",
    etaOffset: 4,
    createdOffset: 0,
    status: "intake",
    assigned: "Unassigned",
    docs: ["Commercial invoice", "Packing list"],
    flags: [],
    lines: [
      { description: "Hydraulic hose, 1/2 inch, 2-wire braid, 3000 PSI", quantity: 60, unit_price: 7.25, currency: "USD", origin: "United States", material: "Rubber / steel" },
      { description: "JIC hydraulic fitting, straight, 1/2 inch", quantity: 200, unit_price: 1.85, currency: "USD", origin: "United States", material: "Steel" },
      { description: "Filter element, hydraulic, 5 micron", quantity: 24, unit_price: 19.4, currency: "USD", origin: "United States", material: null },
    ],
  },
];

/* Workspace activity stream — newest first. minsAgo drives the label.  */
export const ACTIVITY = [
  { id: 1, kind: "ai", minsAgo: 4, text: "Extracted 3 line items from ENT-24823 (Frontera) and proposed tariff codes.", entry: "ENT-24823" },
  { id: 2, kind: "flag", minsAgo: 22, text: "Risk flag raised on ENT-24822 — India carbon-steel pipe screened against SIMA measures.", entry: "ENT-24822" },
  { id: 3, kind: "broker", minsAgo: 51, text: "D. Achterberg confirmed 3 of 4 codes on ENT-24809 and staged the entry to file.", entry: "ENT-24809" },
  { id: 4, kind: "hold", minsAgo: 96, text: "ENT-24811 placed on hold — CUSMA certification of origin outstanding.", entry: "ENT-24811" },
  { id: 5, kind: "filed", minsAgo: 188, text: "ENT-24814 (Vertex) filed with CBSA. B3 accepted, duty assessed free under CUSMA.", entry: "ENT-24814" },
  { id: 6, kind: "ai", minsAgo: 243, text: "Re-classified ENT-24820 line 1 (nitrile gloves) — escalated to manual review.", entry: "ENT-24820" },
];

export function clientById(id) {
  return CLIENTS.find((c) => c.id === id) || null;
}
export function entryById(id) {
  return ENTRIES.find((e) => e.id === id) || null;
}
export function entriesForClient(id) {
  return ENTRIES.filter((e) => e.clientId === id);
}

/* The sample invoice used by the classifier intake when no file is on  */
/* hand — mirrors a real Vertex shipment.                               */
export const SAMPLE_INVOICE = [
  { description: "Hydraulic gear pump, cast iron body, 25 GPM", quantity: 4, unit_price: 312.5, currency: "USD", origin: "United States", material: "Cast iron / steel" },
  { description: "316 SS ball valve, 2 inch, flanged", quantity: 12, unit_price: 88.0, currency: "USD", origin: "United States", material: "Stainless steel 316" },
  { description: "Ring joint gasket R-37, soft iron", quantity: 50, unit_price: 6.4, currency: "USD", origin: "India", material: null },
  { description: "Lubricating grease, lithium complex, 400g cartridge", quantity: 24, unit_price: 9.15, currency: "USD", origin: "United States", material: null },
  { description: "AC electric motor, 3-phase, TEFC", quantity: 2, unit_price: 540.0, currency: "USD", origin: "Mexico", material: null },
  { description: "Nitrile safety gloves, cut-resistant, size L", quantity: 200, unit_price: 1.25, currency: "USD", origin: "Malaysia", material: "Nitrile" },
];
