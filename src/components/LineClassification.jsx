import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, ChevronRight, Pencil, Check, X, BookMarked, ShieldAlert } from "lucide-react";
import { C, MONO } from "../theme.js";
import { MonoLabel, ConfidenceBar, Meta, ProposedTag } from "./ui.jsx";
import { useStore } from "../store/StoreContext.jsx";
import { isCleared } from "../lib/classify.js";
import { pct, money } from "../lib/format.js";

/* One line's classification: the AI proposal with its GRI path and        */
/* grounded duty/treatment, the precedent match, and the specialist's      */
/* accept / edit / reject. A committed decision shows who decided and when. */
export default function LineClassification({ shipment, lv, index, precedents = [], readOnly }) {
  const { decideClassification } = useStore();
  const { line, proposal, committed } = lv;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftHs, setDraftHs] = useState(proposal.hs === "—" ? "" : proposal.hs);
  const [draftReason, setDraftReason] = useState("");

  const ok = isCleared(proposal.confidence);
  const precedent = precedents.find((p) => p.description?.toLowerCase().slice(0, 12) === line.description.toLowerCase().slice(0, 12) || (p.hs && p.hs === proposal.hs));

  function accept() {
    decideClassification(shipment.id, line.id, {
      status: "accepted", hs: proposal.hs, heading: proposal.heading, gri: proposal.gri,
      treatmentKey: proposal.treatment?.key, treatmentCode: proposal.treatment?.code, confidence: proposal.confidence,
    });
  }
  function saveEdit() {
    decideClassification(shipment.id, line.id, {
      status: "edited", hs: draftHs.trim() || "—", heading: proposal.heading, gri: proposal.gri,
      treatmentKey: proposal.treatment?.key, treatmentCode: proposal.treatment?.code, confidence: proposal.confidence,
      reason: draftReason.trim() || "Code edited by specialist.",
    });
    setEditing(false);
  }
  function reject() {
    decideClassification(shipment.id, line.id, { status: "rejected", hs: "—", heading: proposal.heading, gri: proposal.gri, confidence: proposal.confidence, reason: "Sent back for manual classification." });
  }

  const accent = committed ? C.good : ok ? C.good : C.warn;

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 9, overflow: "hidden" }}>
      <div className="flex items-start justify-between" style={{ padding: "13px 15px 9px", gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>{String(index + 1).padStart(2, "0")}</span>
            <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{line.description}</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub, marginTop: 5, marginLeft: 25 }}>
            {(line.quantity || 1)} {line.unit_price != null ? `× ${money(line.unit_price)} ${line.currency || ""}` : "units"}
            {line.origin ? `  ·  origin ${line.origin}` : ""}
            {line.material ? `  ·  ${line.material}` : ""}
          </div>
          {line.source_field && (
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 4, marginLeft: 25 }}>source: {line.source_field}</div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          {committed ? (
            <span className="inline-flex items-center" style={{ gap: 6, background: C.goodBg, border: `1px solid ${C.goodLine}`, borderRadius: 999, padding: "4px 10px", fontFamily: MONO, fontSize: 10, fontWeight: 600, color: C.good }}>
              <CheckCircle2 size={12} /> {committed.status === "edited" ? "EDITED & COMMITTED" : "ACCEPTED"}
            </span>
          ) : (
            <ProposedTag />
          )}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, padding: "11px 15px", marginLeft: 25 }}>
        <div className="flex items-baseline" style={{ gap: 11, flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: (committed?.hs || proposal.hs) === "—" ? C.faint : C.ink }}>{committed?.hs || proposal.hs}</span>
          <span style={{ fontSize: 12.5, color: C.sub }}>{committed?.heading || proposal.heading}</span>
        </div>
        <div className="flex items-center" style={{ gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          <Meta k="Treatment" v={`${proposal.treatment?.label || "—"}${proposal.treatment?.code ? ` (${proposal.treatment.code})` : ""}`} />
          <Meta k="Duty" v={proposal.duty ? pct(proposal.duty.rate) : "ungrounded"} vColor={proposal.duty ? C.ink : C.warn} />
          <Meta k="GRI" v={proposal.gri} />
          {!committed && <ConfidenceBar conf={proposal.confidence} />}
        </div>

        {/* SIMA / OGD flags on the line */}
        {(proposal.sima?.length > 0 || proposal.ogd?.length > 0) && (
          <div className="flex items-center" style={{ gap: 8, marginTop: 9, flexWrap: "wrap" }}>
            {proposal.sima?.map((m, i) => (
              <span key={`s${i}`} className="inline-flex items-center" style={{ gap: 5, fontFamily: MONO, fontSize: 10, color: C.alert, background: C.alertBg, border: `1px solid ${C.alertLine}`, borderRadius: 999, padding: "3px 9px" }}>
                <ShieldAlert size={11} /> SIMA — {m.product}
              </span>
            ))}
            {proposal.ogd?.map((r, i) => (
              <span key={`o${i}`} className="inline-flex items-center" style={{ gap: 5, fontFamily: MONO, fontSize: 10, color: C.warn, background: C.warnBg, border: `1px solid ${C.warnLine}`, borderRadius: 999, padding: "3px 9px" }}>
                <AlertTriangle size={11} /> OGD — {r.dept}
              </span>
            ))}
          </div>
        )}

        {precedent && (
          <div className="flex items-center" style={{ gap: 7, marginTop: 9 }}>
            <BookMarked size={12} color={C.accent} />
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.accent }}>precedent: {precedent.hs} settled for this importer ({precedent.decidedByName || "broker"})</span>
          </div>
        )}

        {/* basis */}
        <button onClick={() => setOpen((o) => !o)} className="flex items-center" style={{ gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, color: C.sub, fontFamily: MONO, fontSize: 11, marginTop: 10 }}>
          <ChevronRight size={12} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
          {open ? "Hide basis" : "Show GRI basis"}
        </button>
        {open && (
          <div style={{ marginTop: 8, background: C.panelAlt, border: `1px solid ${C.line}`, borderRadius: 7, padding: "10px 12px" }}>
            <MonoLabel style={{ display: "block", marginBottom: 5 }}>{proposal.gri} · basis</MonoLabel>
            <div style={{ fontSize: 12.5, color: "#4A5260", lineHeight: 1.5 }}>{proposal.notes}</div>
            {proposal.lowReason && <div style={{ fontSize: 12, color: C.warn, marginTop: 6 }}>⚠ {proposal.lowReason}</div>}
          </div>
        )}

        {/* committed footer or decision controls */}
        {committed ? (
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 11 }}>
            committed by {committed.decidedByName || committed.decidedBy} · {committed.reason || "accepted AI proposal"}
          </div>
        ) : readOnly ? null : editing ? (
          <div style={{ marginTop: 11, background: C.panelAlt, border: `1px solid ${C.accentLine}`, borderRadius: 7, padding: "11px 12px" }}>
            <MonoLabel color={C.accent}>Override the proposed code</MonoLabel>
            <div className="flex items-center" style={{ gap: 8, marginTop: 7 }}>
              <input value={draftHs} onChange={(e) => setDraftHs(e.target.value)} placeholder="HS 10-digit" style={{ fontFamily: MONO, fontSize: 12.5, padding: "7px 9px", border: `1px solid ${C.line}`, borderRadius: 6, width: 170, outline: "none", color: C.ink }} />
              <input value={draftReason} onChange={(e) => setDraftReason(e.target.value)} placeholder="Reason for the change (logged)" style={{ flex: 1, fontFamily: "inherit", fontSize: 12.5, padding: "7px 9px", border: `1px solid ${C.line}`, borderRadius: 6, outline: "none", color: C.ink }} />
            </div>
            <div className="flex items-center justify-end" style={{ gap: 8, marginTop: 9 }}>
              <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.sub, fontFamily: MONO, fontSize: 11.5 }}>Cancel</button>
              <button onClick={saveEdit} className="flex items-center" style={{ gap: 5, background: C.accent, border: "none", color: "#fff", borderRadius: 6, padding: "7px 12px", cursor: "pointer", fontFamily: MONO, fontSize: 11.5 }}><Check size={12} /> Save & commit</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end" style={{ gap: 8, marginTop: 12 }}>
            <button onClick={reject} className="flex items-center" style={{ gap: 6, background: C.panel, border: `1px solid ${C.line}`, color: C.sub, borderRadius: 6, padding: "6px 11px", cursor: "pointer", fontFamily: MONO, fontSize: 11 }}><X size={12} /> Reject</button>
            <button onClick={() => setEditing(true)} className="flex items-center" style={{ gap: 6, background: C.panel, border: `1px solid ${C.line}`, color: C.sub, borderRadius: 6, padding: "6px 11px", cursor: "pointer", fontFamily: MONO, fontSize: 11 }}><Pencil size={12} /> Edit code</button>
            <button onClick={accept} disabled={proposal.hs === "—"} className="flex items-center" style={{ gap: 6, background: proposal.hs === "—" ? C.mutedBg : C.ink, border: "none", color: proposal.hs === "—" ? C.faint : "#fff", borderRadius: 6, padding: "6px 12px", cursor: proposal.hs === "—" ? "not-allowed" : "pointer", fontFamily: MONO, fontSize: 11 }}>
              <Check size={12} /> Accept proposal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
