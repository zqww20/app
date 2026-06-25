import React from "react";
import { Scale, Landmark, Receipt, Archive, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { C, MONO } from "../../theme.js";
import { Panel, MonoLabel, Button, Callout, Field } from "../ui.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { summarize } from "../../lib/shipment.js";
import { money, fmtDate } from "../../lib/format.js";
import { REFERENCE_SETS } from "../../reference/referenceData.js";

const VFD_METHODS = [
  { k: "transaction_value", label: "Transaction value", note: "Price paid or payable, the default method." },
  { k: "identical_goods", label: "Transaction value of identical goods" },
  { k: "similar_goods", label: "Transaction value of similar goods" },
  { k: "deductive", label: "Deductive value" },
  { k: "computed", label: "Computed value" },
  { k: "residual", label: "Residual method" },
];

export function ValuationStation({ shipment }) {
  const { setValuationMethod } = useStore();
  const current = shipment.valuation?.method;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Callout tone="info" icon={Info} title="Phase 1 — record the VFD method">
        Record the value-for-duty method here. Incoterm-driven adjustments (transport/insurance deductions) and additions to price paid or payable (assists, royalties, commissions) are itemized in the full valuation workspace in a later phase.
      </Callout>
      <Panel style={{ padding: "15px 18px" }}>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}><Scale size={15} color={C.sub} /><MonoLabel>Value-for-duty method</MonoLabel></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {VFD_METHODS.map((m) => {
            const active = current === m.k;
            return (
              <button key={m.k} onClick={() => setValuationMethod(shipment.id, m.k)} className="flex items-center justify-between" style={{ textAlign: "left", padding: "10px 13px", borderRadius: 7, border: `1px solid ${active ? C.accent : C.line}`, background: active ? C.accentBg : C.panel, cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: C.ink }}>{m.label}</div>
                  {m.note && <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{m.note}</div>}
                </div>
                {active && <CheckCircle2 size={15} color={C.accent} />}
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

export function AccountingStation({ shipment }) {
  const { assembleCad } = useStore();
  const carm = REFERENCE_SETS.carm;
  const accounted = shipment.state === "accounted" || shipment.state === "billed" || shipment.accounting?.cadRef;
  const assembled = shipment.accounting?.assembled;
  const sum = summarize(shipment);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel style={{ padding: "15px 18px" }}>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}><Landmark size={15} color={C.sub} /><MonoLabel>CARM accounting parameters</MonoLabel></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14 }}>
          <Field label="Instrument" value={carm.instrument} />
          <Field label="Account within" value={`${carm.accountForReleaseWithinBusinessDays} business days of release`} />
          <Field label="SOA issued" value={`Day ${carm.soaIssuedDayOfMonth} of month`} />
          <Field label="Payment due" value={carm.paymentDueRule} />
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 11 }}>{carm.source}</div>
      </Panel>

      {accounted ? (
        <Callout tone="good" icon={CheckCircle2} title="CAD submitted">
          <div>Commercial Accounting Declaration accepted <span style={{ fontFamily: MONO, marginLeft: 6 }}>{shipment.accounting?.cadRef}</span>{shipment.accounting?.stub && <span style={{ color: C.faint }}> · stubbed</span>}</div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 5 }}>Reconcile against the importer’s CARM statement of account when issued.</div>
        </Callout>
      ) : (
        <Panel style={{ padding: "15px 18px" }}>
          <MonoLabel style={{ display: "block", marginBottom: 8 }}>Assemble declaration</MonoLabel>
          <div className="flex items-center justify-between" style={{ padding: "8px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
            <span style={{ fontSize: 13, color: C.sub }}>Duty</span><span style={{ fontFamily: MONO, fontWeight: 600 }}>{money(sum.duty)}</span>
          </div>
          <div className="flex items-center justify-between" style={{ padding: "8px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
            <span style={{ fontSize: 13, color: C.sub }}>GST</span><span style={{ fontFamily: MONO, fontWeight: 600 }}>{money(sum.gst)}</span>
          </div>
          <div style={{ marginTop: 14 }}>
            {assembled ? (
              <Callout tone="good" icon={ShieldCheck} title="Assembled — sign-off required">
                CAD assembled and checked against the accepted classification and valuation. Use “Sign off & submit CAD” in the actions bar above — submission requires a licensed broker.
              </Callout>
            ) : (
              <div className="flex items-center justify-end">
                <Button variant="primary" icon={Landmark} onClick={() => assembleCad(shipment.id)}>Assemble CAD from released file</Button>
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}

export function BillingStation({ shipment }) {
  const sum = summarize(shipment);
  const disbursed = sum.duty + sum.gst;
  const brokerFee = Math.max(85, Math.round(sum.value * 0.01));
  const total = disbursed + brokerFee;
  const billed = shipment.state === "billed" || shipment.billing?.invoiced;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Callout tone="info" icon={Info} title="Operational client billing">
        Internal accounting: duty and tax disbursed on the importer’s behalf, plus broker fees per the agreed schedule. Reconciles disbursed against billed.
      </Callout>
      <Panel style={{ padding: "15px 18px" }}>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}><Receipt size={15} color={C.sub} /><MonoLabel>Client invoice {shipment.billing?.invoiceNo ? `· ${shipment.billing.invoiceNo}` : "(draft)"}</MonoLabel></div>
        {[["Duty disbursed", money(sum.duty)], ["GST disbursed", money(sum.gst)], ["Broker fee (schedule)", money(brokerFee)]].map(([k, v], i) => (
          <div key={k} className="flex items-center justify-between" style={{ padding: "9px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
            <span style={{ fontSize: 13, color: C.sub }}>{k}</span><span style={{ fontFamily: MONO, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
        <div className="flex items-center justify-between" style={{ padding: "10px 0 0" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Total invoice</span><span style={{ fontFamily: MONO, fontWeight: 700 }}>{money(total)}</span>
        </div>
      </Panel>
      {billed ? (
        <Callout tone="good" icon={CheckCircle2} title="Invoice issued">Invoice {shipment.billing?.invoiceNo || "issued"} to the importer. Disbursement reconciled.</Callout>
      ) : (
        <Callout tone="info" icon={Info} title="Issue via the actions bar">Use “Issue client invoice” in the actions bar above. Invoice issuance is a reviewed step.</Callout>
      )}
    </div>
  );
}

export function PostEntryStation({ shipment }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Callout tone="info" icon={Archive} title="Post-entry & recordkeeping">
        Six-year retention runs from accounting. This station holds corrections (CAD revisions), refund/drawback claims, ruling requests, and verification responses — every external filing prepared by an advisor and gated on sign-off. Depth lands in a later phase.
      </Callout>
      {shipment.state === "under_correction" ? (
        <Callout tone="warn" icon={Info} title="Correction open">
          A post-entry correction is open on this file. Sign off the CAD revision in the actions bar above to re-account.
        </Callout>
      ) : (
        <Panel style={{ padding: "15px 18px" }}>
          <MonoLabel style={{ display: "block", marginBottom: 8 }}>Recordkeeping</MonoLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14 }}>
            <Field label="Documents retained" value={`${shipment.documents.length} · 6-year clock`} mono />
            <Field label="Release" value={shipment.release?.cbsaRef || "—"} mono />
            <Field label="Accounting" value={shipment.accounting?.cadRef || "—"} mono />
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 12 }}>Open a correction from the actions bar above if a classification, value, or treatment needs amending after accounting.</div>
        </Panel>
      )}
    </div>
  );
}
