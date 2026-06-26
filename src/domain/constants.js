/* ------------------------------------------------------------------ */
/*  Domain constants — roles, document types, lifecycle stages and      */
/*  shipment states. These describe the *shape* of the workflow; the    */
/*  regulatory values (tariff, rates, treatments, OGD rules) live in    */
/*  versioned reference data, never here.                               */
/* ------------------------------------------------------------------ */

/* Roles. A user may hold several. Sign-off authority is its own        */
/* capability, granted explicitly — most users do not have it.          */
export const ROLES = {
  release_clerk: { id: "release_clerk", label: "Release clerk", short: "Clerk" },
  classification_specialist: { id: "classification_specialist", label: "Classification specialist", short: "Classifier" },
  compliance_advisor: { id: "compliance_advisor", label: "Trade compliance advisor", short: "Advisor" },
  accounting: { id: "accounting", label: "Accounting / disbursement", short: "Accounting" },
  operations_manager: { id: "operations_manager", label: "Operations manager", short: "Ops manager" },
};

export const SIGNOFF = "signoff_authority"; // capability flag, not a role

export const ROLE_ORDER = [
  "operations_manager",
  "release_clerk",
  "classification_specialist",
  "compliance_advisor",
  "accounting",
];

/* Document types accepted at intake. */
export const DOC_TYPES = {
  commercial_invoice: "Commercial invoice",
  packing_list: "Packing list",
  bill_of_lading: "Bill of lading",
  air_waybill: "Air waybill",
  cargo_control: "Cargo control document",
  certificate_of_origin: "Certificate of origin",
  permit: "Permit / OGD document",
  other: "Other",
};

/* Lifecycle stages, in order. The shipment file's journey and the      */
/* navigation are the same thing.                                       */
export const STAGES = [
  { id: "intake", label: "Intake" },
  { id: "classification", label: "Classification" },
  { id: "valuation", label: "Valuation" },
  { id: "assessment", label: "Assessment" },
  { id: "release", label: "Release" },
  { id: "accounting", label: "Accounting" },
  { id: "billing", label: "Billing" },
  { id: "post_entry", label: "Post-entry" },
  { id: "archive", label: "Archive" },
];

export const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.id, s.label]));

/* Granular shipment states. `stage` ties each to a lifecycle stage;     */
/* `tone` drives the status colour.                                      */
export const STATES = {
  awaiting_documents: { id: "awaiting_documents", stage: "intake", label: "Awaiting documents", tone: "neutral" },
  in_intake: { id: "in_intake", stage: "intake", label: "In intake", tone: "info" },
  in_classification: { id: "in_classification", stage: "classification", label: "In classification", tone: "info" },
  in_valuation: { id: "in_valuation", stage: "valuation", label: "In valuation", tone: "info" },
  in_assessment: { id: "in_assessment", stage: "assessment", label: "In assessment", tone: "info" },
  pending_release_signoff: { id: "pending_release_signoff", stage: "release", label: "Pending broker sign-off", tone: "warn" },
  released: { id: "released", stage: "release", label: "Released", tone: "good" },
  in_accounting: { id: "in_accounting", stage: "accounting", label: "In accounting", tone: "info" },
  accounted: { id: "accounted", stage: "accounting", label: "Accounted", tone: "good" },
  billed: { id: "billed", stage: "billing", label: "Billed", tone: "good" },
  under_correction: { id: "under_correction", stage: "post_entry", label: "Under correction", tone: "alert" },
  archived: { id: "archived", stage: "archive", label: "Archived", tone: "muted" },
};

export const stateOf = (id) => STATES[id] || STATES.awaiting_documents;

/* Classification decision states for a line item. */
export const CLS_STATUS = {
  proposed: "proposed", // AI draft, not yet reviewed
  accepted: "accepted", // specialist accepted the proposal
  edited: "edited", // specialist changed the code
  rejected: "rejected", // sent back / needs manual work
};

/* Audit action vocabulary — kept open-ended (strings) but these are     */
/* the common ones, for consistency in the log.                          */
export const AUDIT = {
  shipment_created: "shipment.created",
  state_changed: "shipment.state_changed",
  document_added: "document.added",
  extraction_run: "extraction.run",
  intake_confirmed: "intake.confirmed",
  line_classified: "classification.decided",
  release_transmitted: "release.transmitted",
  cad_submitted: "accounting.cad_submitted",
  invoice_issued: "billing.invoice_issued",
  assigned: "work.assigned",
  override: "validation.override",
  note: "note.added",
};
