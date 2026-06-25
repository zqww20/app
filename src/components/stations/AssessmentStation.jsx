import React from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { C, MONO } from "../../theme.js";
import { Panel, MonoLabel, Button, Callout } from "../ui.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { summarize } from "../../lib/shipment.js";
import { money, pct } from "../../lib/format.js";
import { REFERENCE_SETS, gstRate } from "../../reference/referenceData.js";

function Row({ k, v, sub, strong }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "9px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
      <div>
        <div style={{ fontSize: 13, color: C.ink, fontWeight: strong ? 600 : 400 }}>{k}</div>
        {sub && <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: strong ? 700 : 600, color: C.ink }}>{v}</div>
    </div>
  );
}

export default function AssessmentStation({ shipment }) {
  const { reviewAssessment } = useStore();
  const sum = summarize(shipment);
  const reviewed = shipment.assessment?.reviewed;
  const landed = sum.value + sum.duty + sum.gst;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Callout tone="info" icon={Info} title="Phase 1 — assessment summary">
        Duty, GST, SIMA and OGD are computed from versioned reference data with each component’s source cited. The full assessment workspace (line-level overrides, excise, surtax) lands in a later phase.
      </Callout>

      <Panel style={{ padding: "15px 18px" }}>
        <MonoLabel style={{ display: "block", marginBottom: 8 }}>Landed obligation (illustrative)</MonoLabel>
        <Row k="Value for duty" v={money(sum.value)} sub={`transaction value · FX ref ${REFERENCE_SETS.fx.version}`} />
        <Row k="Customs duty" v={money(sum.duty)} sub={`by 10-digit code · rates ref ${REFERENCE_SETS.rates.version}`} />
        <Row k={`GST (${pct(gstRate(), 0)})`} v={money(sum.gst)} sub="on duty-paid value" />
        <Row k="Total landed" v={money(landed)} strong />
      </Panel>

      {/* SIMA */}
      <Panel style={{ padding: "15px 18px" }}>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
          <ShieldAlert size={15} color={sum.sima.length ? C.alert : C.sub} />
          <MonoLabel color={sum.sima.length ? C.alert : C.faint}>SIMA screening · {sum.sima.length} hit{sum.sima.length === 1 ? "" : "s"}</MonoLabel>
        </div>
        {sum.sima.length === 0 ? (
          <div style={{ fontSize: 12.5, color: C.sub }}>No line intersects an active anti-dumping / countervailing measure in the reference set.</div>
        ) : (
          sum.sima.map((h, i) => (
            <div key={i} style={{ background: C.alertBg, border: `1px solid ${C.alertLine}`, borderRadius: 7, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 600 }}>{h.line.description} · origin {h.line.origin}</div>
              <div style={{ fontSize: 12, color: "#5A3033", marginTop: 3, lineHeight: 1.45 }}>{h.measure.product} — {h.measure.note}</div>
            </div>
          ))
        )}
      </Panel>

      {/* OGD */}
      <Panel style={{ padding: "15px 18px" }}>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
          <AlertTriangle size={15} color={sum.ogd.length ? C.warn : C.sub} />
          <MonoLabel color={sum.ogd.length ? C.warn : C.faint}>OGD / PGA screening · {sum.ogd.length}</MonoLabel>
        </div>
        {sum.ogd.length === 0 ? (
          <div style={{ fontSize: 12.5, color: C.sub }}>No other-government-department release requirement flagged for these lines.</div>
        ) : (
          sum.ogd.map((h, i) => (
            <div key={i} style={{ fontSize: 12.5, color: C.sub, paddingBottom: 7, marginBottom: 7, borderBottom: i < sum.ogd.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
              <span style={{ color: C.ink, fontWeight: 600 }}>{h.req.dept}</span> — {h.line.description}: {h.req.requirement}
            </div>
          ))
        )}
      </Panel>

      {reviewed ? (
        <Callout tone="good" icon={CheckCircle2} title="Assessment reviewed">
          SIMA and OGD screening reviewed by the advisor. The file can advance to prepare the release request.
        </Callout>
      ) : (
        <div className="flex items-center justify-end">
          <Button variant="primary" icon={CheckCircle2} onClick={() => reviewAssessment(shipment.id)}>Mark assessment reviewed</Button>
        </div>
      )}
    </div>
  );
}
