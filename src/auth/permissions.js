import { ROLES, SIGNOFF } from "../domain/constants.js";

/* Capability map. Roles grant station access; SIGNOFF is a separate,     */
/* always-explicit capability that gates anything filed with CBSA.        */
const ROLE_CAPS = {
  release_clerk: ["intake.edit", "release.prepare", "shipment.create", "document.add", "extraction.run"],
  classification_specialist: ["classification.decide", "precedent.write", "shipment.create"],
  compliance_advisor: ["assessment.review", "postentry.prepare", "ogd.review", "reference.edit"],
  accounting: ["accounting.assemble", "billing.issue", "reference.edit"],
  operations_manager: ["work.assign", "everything.view", "reference.edit"],
};

export function capabilitiesFor(user) {
  const caps = new Set();
  for (const r of user?.roles || []) (ROLE_CAPS[r] || []).forEach((c) => caps.add(c));
  if (user?.signoff) caps.add(SIGNOFF);
  // everyone can view their files
  caps.add("shipment.view");
  caps.add("importer.view");
  return caps;
}

export function can(user, capability) {
  return capabilitiesFor(user).has(capability);
}

export function hasSignoff(user) {
  return !!user?.signoff;
}

export function roleLabels(user) {
  return (user?.roles || []).map((r) => ROLES[r]?.label || r);
}
