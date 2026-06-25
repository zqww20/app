/* ------------------------------------------------------------------ */
/*  CARM / CBSA transmission adapter — STUB.                           */
/*  Real connectors implement this same interface (EDI/API). Nothing    */
/*  here auto-transmits: callers only reach these after a human with    */
/*  sign-off authority has committed the action.                        */
/* ------------------------------------------------------------------ */

function ackRef(prefix) {
  const n = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix}-${n}`;
}

/* Transmit a release request. Returns a CBSA acknowledgement stub. */
export async function transmitRelease(payload) {
  await new Promise((r) => setTimeout(r, 500));
  return {
    accepted: true,
    stub: true,
    cbsaRef: ackRef("REL"),
    transmittedAt: Date.now(),
    stream: payload?.stream || "RMD",
    note: "Stubbed CBSA acknowledgement. Replace this adapter with the live release connector.",
  };
}

/* Submit a Commercial Accounting Declaration. */
export async function submitCad(payload) {
  await new Promise((r) => setTimeout(r, 500));
  return {
    accepted: true,
    stub: true,
    cadRef: ackRef("CAD"),
    submittedAt: Date.now(),
    revision: payload?.revision || 0,
    note: "Stubbed CARM acknowledgement. Replace with the live CAD connector.",
  };
}
