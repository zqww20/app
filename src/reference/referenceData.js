/* ------------------------------------------------------------------ */
/*  Reference data — versioned, dated, and editable by authorized staff. */
/*  NOTHING regulatory is hardcoded in component or engine logic; it all */
/*  resolves through these datasets so that when CBSA changes a rate,    */
/*  treatment, form, or OGD rule, staff version the data, not the code.  */
/*                                                                       */
/*  Values below are a small, illustrative slice grounded in public CBSA */
/*  references (see `source`). They are effective-dated and must be       */
/*  reconciled against the live Customs Tariff before any real filing.   */
/* ------------------------------------------------------------------ */

export const REFERENCE_SETS = {
  /* Tariff treatments and their CBSA treatment codes (B3-3 field 14      */
  /* lineage, carried into CARM). */
  treatments: {
    id: "treatments",
    title: "Tariff treatments",
    version: "2026.1",
    effective: "2026-01-01",
    source: "CBSA Customs Tariff — List of countries and applicable tariff treatments",
    editableBy: ["classification_specialist", "compliance_advisor"],
    rows: [
      { code: "02", key: "MFN", label: "Most-Favoured-Nation", kind: "unilateral" },
      { code: "09", key: "GPT", label: "General Preferential Tariff", kind: "unilateral" },
      { code: "08", key: "LDCT", label: "Least Developed Country Tariff", kind: "unilateral" },
      { code: "10", key: "CCCT", label: "Commonwealth Caribbean Country Tariff", kind: "unilateral" },
      { code: "UST", key: "CUSMA-US", label: "United States Tariff (CUSMA)", kind: "fta" },
      { code: "MXT", key: "CUSMA-MX", label: "Mexico Tariff (CUSMA)", kind: "fta" },
      { code: "CEUT", key: "CETA", label: "Canada-EU Tariff (CETA)", kind: "fta" },
      { code: "CPTPT", key: "CPTPP", label: "CPTPP Tariff", kind: "fta" },
      { code: "CUKT", key: "CUKTCA", label: "Canada-UK Trade Continuity (CUKTCA)", kind: "fta" },
    ],
  },

  /* Exchange rates — dated. Real systems pull the CBSA-applicable rate    */
  /* for the date of direct shipment via the FX adapter.                  */
  fx: {
    id: "fx",
    title: "Exchange rates (to CAD)",
    version: "2026-06-24",
    effective: "2026-06-24",
    source: "Adapter: dated CBSA-applicable rates (stubbed)",
    editableBy: ["accounting"],
    rows: [
      { ccy: "USD", rate: 1.3705 },
      { ccy: "EUR", rate: 1.4710 },
      { ccy: "GBP", rate: 1.7320 },
      { ccy: "CNY", rate: 0.1895 },
      { ccy: "MXN", rate: 0.0735 },
      { ccy: "INR", rate: 0.0164 },
      { ccy: "CAD", rate: 1.0 },
    ],
  },

  /* GST/HST and common duty rates keyed loosely to HS chapter ranges —    */
  /* illustrative. Real systems resolve duty by the full 10-digit code     */
  /* and the determined treatment.                                         */
  rates: {
    id: "rates",
    title: "Duty & tax rates",
    version: "2026.1",
    effective: "2026-01-01",
    source: "Illustrative — reconcile against live Customs Tariff",
    editableBy: ["classification_specialist", "accounting"],
    gst: 0.05,
    rows: [
      // matched by HS heading prefix; first match wins
      { prefix: "84", mfn: 0, note: "Most machinery of Ch. 84 is MFN free." },
      { prefix: "85", mfn: 0, note: "Most goods of Ch. 85 are MFN free." },
      { prefix: "90", mfn: 0, note: "Measuring/instrument goods of Ch. 90 commonly MFN free." },
      { prefix: "7307", mfn: 0.065, note: "Steel pipe fittings carry a positive MFN rate." },
      { prefix: "7306", mfn: 0.0755, note: "Welded steel pipe carries a positive MFN rate." },
      { prefix: "7318", mfn: 0.065, note: "Steel fasteners carry a positive MFN rate." },
      { prefix: "73", mfn: 0.065, note: "Various iron/steel articles carry positive MFN rates." },
      { prefix: "4009", mfn: 0.035, note: "Rubber hose carries a positive MFN rate." },
      { prefix: "3403", mfn: 0, note: "Lubricating preparations commonly MFN free." },
    ],
  },

  /* OGD / PGA mapping — which department(s) may need to release, keyed by  */
  /* HS prefix or keyword. Illustrative. */
  ogd: {
    id: "ogd",
    title: "OGD / PGA requirements",
    version: "2026.1",
    effective: "2026-01-01",
    source: "Illustrative mapping — verify against CBSA Single Window participating departments",
    editableBy: ["compliance_advisor"],
    rows: [
      { match: { keyword: "valve" }, dept: "—", requirement: null },
      { match: { keyword: "respirator" }, dept: "Health Canada", requirement: "Confirm whether the respirator is a regulated medical/PPE device." },
      { match: { keyword: "radio" }, dept: "ISED", requirement: "Radio apparatus may require ISED technical acceptance." },
      { match: { prefix: "8544" }, dept: "—", requirement: null },
    ],
  },

  /* SIMA — active anti-dumping / countervailing measures, illustrative.   */
  sima: {
    id: "sima",
    title: "SIMA measures (active)",
    version: "2026.1",
    effective: "2026-01-01",
    source: "Illustrative — verify against the CBSA SIMA Measures in Force",
    editableBy: ["compliance_advisor"],
    rows: [
      { product: "Carbon steel welded pipe", origins: ["China", "Chinese Taipei", "India", "Oman", "Korea", "Thailand", "UAE"], prefix: "7306", note: "Certain carbon steel welded pipe is subject to anti-dumping/countervailing duty depending on origin and exporter." },
      { product: "Carbon and alloy steel line pipe", origins: ["China", "Korea"], prefix: "7306", note: "Screen exporter against the measure's scope." },
    ],
  },

  /* CARM accounting parameters — names/timeframes are reference data, not  */
  /* code, because the framework keeps moving.                             */
  carm: {
    id: "carm",
    title: "CARM accounting parameters",
    version: "2026.1",
    effective: "2026-01-01",
    source: "CBSA CARM — CAD replaced B3/B2 (Oct 2024). Verify current mechanics at build time.",
    editableBy: ["accounting"],
    instrument: "Commercial Accounting Declaration (CAD)",
    accountForReleaseWithinBusinessDays: 5,
    soaIssuedDayOfMonth: 25,
    paymentDueRule: "10 weekdays after the 17th of the calendar month",
  },
};

/* --- resolvers — engines call these, never literals ------------------ */

export function treatmentByKey(key) {
  return REFERENCE_SETS.treatments.rows.find((r) => r.key === key || r.code === key) || null;
}

export function fxRate(ccy) {
  const row = REFERENCE_SETS.fx.rows.find((r) => r.ccy === (ccy || "CAD"));
  return row ? row.rate : null;
}

/* Resolve an illustrative MFN duty rate for an HS code by longest-prefix  */
/* match. Returns { rate, note, source } or null when ungrounded.         */
export function dutyRateForHs(hs) {
  if (!hs || hs === "—") return null;
  const digits = hs.replace(/\D/g, "");
  const candidates = REFERENCE_SETS.rates.rows
    .filter((r) => digits.startsWith(r.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length);
  if (!candidates.length) return null;
  const r = candidates[0];
  return { rate: r.mfn, note: r.note, source: `${REFERENCE_SETS.rates.title} v${REFERENCE_SETS.rates.version}` };
}

export function gstRate() {
  return REFERENCE_SETS.rates.gst;
}

/* SIMA screen — returns matching measures for an HS/origin pair. */
export function simaScreen(hs, origin) {
  const digits = (hs || "").replace(/\D/g, "");
  return REFERENCE_SETS.sima.rows.filter(
    (m) => digits.startsWith(m.prefix) && (!origin || m.origins.includes(origin))
  );
}

/* OGD screen — keyword/prefix match against the description and HS. */
export function ogdScreen(description, hs) {
  const d = (description || "").toLowerCase();
  const digits = (hs || "").replace(/\D/g, "");
  return REFERENCE_SETS.ogd.rows.filter((r) => {
    if (r.match.keyword && d.includes(r.match.keyword)) return r.requirement;
    if (r.match.prefix && digits.startsWith(r.match.prefix)) return r.requirement;
    return false;
  });
}

export const referenceSetList = () => Object.values(REFERENCE_SETS);
