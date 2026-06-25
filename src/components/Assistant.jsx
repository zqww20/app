import React, { useState, useRef, useEffect, useMemo } from "react";
import { X, Sparkles, Send, CornerDownLeft, FileSearch } from "lucide-react";
import { C, MONO, SANS } from "../theme.js";
import { useStore } from "../store/StoreContext.jsx";
import { proposeClassification, candidates } from "../lib/classify.js";
import { simaScreen, ogdScreen } from "../reference/referenceData.js";
import { availableTransitions } from "../domain/stateMachine.js";
import { extValue, toCad, money } from "../lib/format.js";

/* ------------------------------------------------------------------ */
/*  Working assistant, scoped to one shipment file. Reasoning is local   */
/*  and deterministic — grounded in the file's data + reference data —   */
/*  and every answer cites what it used. It proposes and explains; it    */
/*  never files. A real deployment routes this to the model with the     */
/*  same grounding and the same no-file contract.                        */
/* ------------------------------------------------------------------ */

function answer(qRaw, ctx) {
  const q = qRaw.toLowerCase().trim();
  const { shipment, importer } = ctx;

  if (!shipment) {
    const cand = candidates(qRaw, 3);
    if (cand.length)
      return { lead: `Best heading match: ${cand[0].hs} — ${cand[0].heading}.`, candidates: cand, cites: ["classification engine", "tariff reference"] };
    return { lead: "Open a shipment file and I can scope answers to it — classify a line, screen SIMA/OGD, or check what's blocking release.", cites: [] };
  }

  // completeness / blocking
  if (/(block|complet|missing|what.*need|ready|advance|next)/.test(q)) {
    const trs = availableTransitions(ctx).filter((t) => t.kind !== "return");
    const blockers = trs.flatMap((t) => t.blockers);
    if (blockers.length)
      return { lead: `${shipment.no} can't advance yet — ${blockers.length} item${blockers.length === 1 ? "" : "s"} outstanding:`, items: [...new Set(blockers)], cites: [`file ${shipment.no}`, "state machine guards", importer ? `importer ${importer.legalName}` : null].filter(Boolean) };
    return { lead: `${shipment.no} is clear to advance to ${trs[0]?.label || "the next stage"}.`, cites: [`file ${shipment.no}`, "state machine guards"] };
  }

  // SIMA
  if (/sima|dumping|countervail|anti-dump/.test(q)) {
    const hits = (shipment.lines || []).flatMap((l) => simaScreen(l.classification?.hs || proposeClassification(l).hs, l.origin).map((m) => ({ l, m })));
    if (hits.length)
      return { lead: `${hits.length} line${hits.length === 1 ? "" : "s"} intersect an active SIMA measure:`, items: hits.map((h) => `${h.l.description} (${h.l.origin}) — ${h.m.product}: ${h.m.note}`), cites: [`file ${shipment.no}`, "SIMA reference (illustrative)"] };
    return { lead: "No line on this file intersects an active SIMA measure in the reference set.", cites: [`file ${shipment.no}`, "SIMA reference"] };
  }

  // OGD
  if (/ogd|pga|permit|health canada|cfia|other government|single window/.test(q)) {
    const hits = (shipment.lines || []).flatMap((l) => ogdScreen(l.description, l.classification?.hs).filter((r) => r.requirement).map((r) => ({ l, r })));
    if (hits.length)
      return { lead: `${hits.length} line${hits.length === 1 ? "" : "s"} may need an OGD release:`, items: hits.map((h) => `${h.l.description} — ${h.r.dept}: ${h.r.requirement}`), cites: [`file ${shipment.no}`, "OGD reference (illustrative)"] };
    return { lead: "No line on this file flags an OGD/PGA requirement in the reference set.", cites: [`file ${shipment.no}`, "OGD reference"] };
  }

  // value / duty summary
  if (/value|duty|cad|total|worth/.test(q)) {
    let v = 0;
    for (const l of shipment.lines || []) v += toCad(extValue(l), l.currency) || 0;
    return { lead: `Declared customs value on ${shipment.no} is about ${money(v)} CAD across ${shipment.lines.length} line${shipment.lines.length === 1 ? "" : "s"} (transaction value, converted at the dated reference rate).`, cites: [`file ${shipment.no}`, "FX reference"] };
  }

  // classify a specific line or free text — try to match a line first
  const line = (shipment.lines || []).find((l) => q.includes(l.description.toLowerCase().split(",")[0].slice(0, 8)));
  const target = line ? line.description : qRaw;
  const p = proposeClassification(line || { description: qRaw, origin: shipment.originCountry });
  if (p.hs !== "—")
    return {
      lead: `${target}: proposed ${p.hs} — ${p.heading} (${p.gri}).`,
      body: p.lowReason ? `Confidence ${Math.round(p.confidence * 100)}% — ${p.lowReason} Routed to specialist review.` : `Confidence ${Math.round(p.confidence * 100)}%. Treatment: ${p.treatment?.label || "—"}.`,
      cites: [line ? `file ${shipment.no}` : null, "classification engine", "tariff reference"].filter(Boolean),
    };
  const cand = candidates(qRaw, 3);
  return { lead: p.lowReason || "I couldn't pin a single heading.", candidates: cand, body: p.missingSpec ? `Deciding spec missing: ${p.missingSpec}.` : null, cites: ["classification engine"] };
}

function Answer({ a }) {
  return (
    <div className="mf-fade" style={{ fontSize: 13, color: C.ink, lineHeight: 1.55 }}>
      <div style={{ fontWeight: 600 }}>{a.lead}</div>
      {a.body && <div style={{ color: C.sub, marginTop: 7 }}>{a.body}</div>}
      {a.candidates?.length > 0 && (
        <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 6 }}>
          {a.candidates.map((c, i) => (
            <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 7, padding: "7px 9px", background: C.panelAlt }}>
              <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: c.hs === "—" ? C.faint : C.ink }}>{c.hs}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: c.conf >= 0.8 ? C.good : C.warn, marginLeft: 7 }}>{Math.round(c.conf * 100)}%</span>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{c.heading}</div>
            </div>
          ))}
        </div>
      )}
      {a.items && (
        <ul style={{ margin: "8px 0 0", paddingLeft: 16, color: C.sub, fontSize: 12.5 }}>
          {a.items.map((it, i) => <li key={i} style={{ marginBottom: 4 }}>{it}</li>)}
        </ul>
      )}
      {a.cites?.length > 0 && (
        <div className="flex items-center" style={{ gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <FileSearch size={11} color={C.faint} />
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint }}>used: {a.cites.join(" · ")}</span>
        </div>
      )}
    </div>
  );
}

export default function Assistant({ open, onClose, shipmentId }) {
  const { getShipment, importerOf } = useStore();
  const shipment = shipmentId ? getShipment(shipmentId) : null;
  const importer = importerOf(shipment);
  const ctx = useMemo(() => ({ shipment, importer }), [shipment, importer]);

  const suggestions = shipment
    ? ["What's blocking this file?", "Screen this file for SIMA", "Any OGD requirements?", "Declared value of this shipment?"]
    : ["Classify a 316 stainless ball valve", "Welded carbon steel pipe heading", "Hydraulic gear pump tariff"];

  const [msgs, setMsgs] = useState([]);
  const [val, setVal] = useState("");
  const scroll = useRef(null);

  useEffect(() => {
    // reset thread intro when the scoped file changes
    setMsgs([
      {
        role: "ai",
        a: {
          lead: shipment ? `Scoped to ${shipment.no}.` : "No file open.",
          body: shipment
            ? "Ask me to explain a classification, screen SIMA/OGD, or check what's blocking this file. I cite what I use and never file."
            : "Open a shipment to scope me to its data, or ask a general classification question.",
          cites: [],
        },
      },
    ]);
  }, [shipmentId]); // eslint-disable-line

  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [msgs, open]);

  function ask(text) {
    const q = (text ?? val).trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "ai", a: answer(q, ctx) }]);
    setVal("");
  }

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} className="mf-fade" style={{ position: "fixed", inset: 0, background: "rgba(26,35,48,0.26)", zIndex: 40 }} />
      <div className="mf-slide" style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: 408, maxWidth: "92vw", background: C.panel, borderLeft: `1px solid ${C.line}`, boxShadow: "-12px 0 32px rgba(26,35,48,0.10)", zIndex: 41, display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between" style={{ padding: "15px 17px", borderBottom: `1px solid ${C.line}` }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={16} color={C.accent} />
            </div>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700 }}>Assistant</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: C.faint, letterSpacing: "0.05em" }}>
                {shipment ? `SCOPED · ${shipment.no}` : "GENERAL"} · PROPOSES, NEVER FILES
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={C.sub} />
          </button>
        </div>

        <div ref={scroll} style={{ flex: 1, overflowY: "auto", padding: 17 }}>
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex" style={{ justifyContent: "flex-end", marginBottom: 13 }}>
                <div style={{ background: C.ink, color: "#fff", fontSize: 13, borderRadius: "11px 11px 3px 11px", padding: "8px 12px", maxWidth: "82%", lineHeight: 1.45 }}>{m.text}</div>
              </div>
            ) : (
              <div key={i} style={{ marginBottom: 17 }}>
                <Answer a={m.a} />
              </div>
            )
          )}
        </div>

        {msgs.length <= 1 && (
          <div style={{ padding: "0 17px 8px", display: "flex", flexWrap: "wrap", gap: 7 }}>
            {suggestions.map((s) => (
              <button key={s} onClick={() => ask(s)} style={{ fontFamily: SANS, fontSize: 11.5, color: C.sub, background: C.panelAlt, border: `1px solid ${C.line}`, borderRadius: 999, padding: "5px 11px", cursor: "pointer" }}>{s}</button>
            ))}
          </div>
        )}

        <div style={{ padding: "11px 17px 15px", borderTop: `1px solid ${C.line}` }}>
          <div className="flex items-end" style={{ gap: 8, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", background: C.panelAlt }}>
            <textarea
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
              placeholder={shipment ? `Ask about ${shipment.no}…` : "Ask a classification question…"}
              rows={1}
              style={{ flex: 1, resize: "none", border: "none", outline: "none", background: "transparent", fontFamily: SANS, fontSize: 13, color: C.ink, lineHeight: 1.4, maxHeight: 90 }}
            />
            <button onClick={() => ask()} disabled={!val.trim()} style={{ background: val.trim() ? C.accent : C.mutedBg, border: "none", borderRadius: 7, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: val.trim() ? "pointer" : "default", flexShrink: 0 }}>
              <Send size={14} color={val.trim() ? "#fff" : C.faint} />
            </button>
          </div>
          <div className="flex items-center" style={{ gap: 5, marginTop: 7, color: C.faint }}>
            <CornerDownLeft size={10} />
            <span style={{ fontFamily: MONO, fontSize: 9.5 }}>Enter to send · answers are proposals, grounded in reference data</span>
          </div>
        </div>
      </div>
    </>
  );
}
