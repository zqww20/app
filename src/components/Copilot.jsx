import React, { useState, useRef, useEffect } from "react";
import { X, Sparkles, Send, CornerDownLeft } from "lucide-react";
import { C, MONO, SANS } from "../theme.js";
import { candidates, classify } from "../lib/classify.js";
import { ENTRIES } from "../data/mockData.js";

/* ------------------------------------------------------------------ */
/*  Ask Manifest — a copilot for the broker.                           */
/*  Reasoning is local & deterministic (the same mock engine that      */
/*  powers classification) so the prototype works offline. It triages   */
/*  the question: classify a good, summarise the queue, or explain a    */
/*  code's basis. Real deployments would route this to the model.       */
/* ------------------------------------------------------------------ */

const SUGGESTIONS = [
  "Classify a 316 stainless ball valve",
  "What's in my review queue today?",
  "Why does the nitrile glove line need manual review?",
  "Duty treatment for US-origin hydraulic pump",
];

function reason(qRaw) {
  const q = qRaw.toLowerCase().trim();

  // Queue / workload questions
  if (/(queue|today|workload|review|pending|backlog|what.* do)/.test(q) && !/why/.test(q)) {
    const review = ENTRIES.filter((e) => e.status === "review");
    const intake = ENTRIES.filter((e) => e.status === "intake" || e.status === "classifying");
    const hold = ENTRIES.filter((e) => e.status === "hold");
    return {
      kind: "queue",
      lead: `You have ${review.length} ${review.length === 1 ? "entry" : "entries"} in broker review, ${intake.length} in intake/classification, and ${hold.length} on hold.`,
      items: [
        ...review.map((e) => `${e.id} · ${e.supplier} — needs code confirmation`),
        ...hold.map((e) => `${e.id} · on hold — ${e.flags[0]?.text || "blocked"}`),
      ],
      foot: "Open Broker review to confirm or override the AI-proposed codes.",
    };
  }

  // Manual-review / "why" questions
  if (/why/.test(q) && /(glove|ppe|manual|review|nitrile)/.test(q)) {
    return {
      kind: "explain",
      lead: "PPE like nitrile gloves has no single heading.",
      body:
        "Gloves split across chapters by material and function — vulcanised rubber (40.15), plastics (39.26), knitted/woven textile (61.16 / 62.16), or specialised protective equipment. The invoice states the material (nitrile) but not whether they are coated, supported, or knit-backed, which decides the chapter. That is why the engine declines to auto-assign and escalates to a broker.",
      foot: "Confirm construction with the importer, then classify manually in the entry.",
    };
  }

  // Classification questions — try to pull candidates
  const cand = candidates(qRaw, 3);
  if (cand.length) {
    const top = cand[0];
    return {
      kind: "classify",
      lead: `Best match: ${top.hs === "—" ? "manual classification required" : top.hs} — ${top.h}.`,
      candidates: cand,
      foot: top.r === 0 ? "Duty: Free under MFN / CUSMA (illustrative). Confirm origin documentation." : "Duty treatment is illustrative — confirm against the live tariff.",
    };
  }

  // Fallback
  const c = classify(qRaw);
  return {
    kind: "classify",
    lead:
      c.hs === "—"
        ? "I couldn't pin a heading from that description."
        : `Best match: ${c.hs} — ${c.h}.`,
    candidates: c.hs === "—" ? [] : [c],
    foot:
      c.hs === "—"
        ? "Add the material, function, or composition and I'll narrow it down — or use Tariff lookup for a side-by-side of candidates."
        : "Every code is AI-proposed and must be broker-confirmed before filing.",
  };
}

function AnswerBlock({ a }) {
  return (
    <div className="mf-fade" style={{ fontSize: 13, color: C.ink, lineHeight: 1.55 }}>
      <div style={{ fontWeight: 600 }}>{a.lead}</div>
      {a.body && <div style={{ color: C.sub, marginTop: 7 }}>{a.body}</div>}

      {a.candidates && a.candidates.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
          {a.candidates.map((c, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${C.line}`,
                borderRadius: 7,
                padding: "8px 10px",
                background: C.panelAlt,
              }}
            >
              <div className="flex items-center" style={{ gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: c.hs === "—" ? C.faint : C.ink }}>
                  {c.hs}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: c.conf >= 0.8 ? C.green : C.amber }}>
                  {Math.round(c.conf * 100)}%
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{c.h}</div>
            </div>
          ))}
        </div>
      )}

      {a.items && (
        <ul style={{ margin: "9px 0 0", paddingLeft: 16, color: C.sub, fontSize: 12.5 }}>
          {a.items.map((it, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              {it}
            </li>
          ))}
        </ul>
      )}

      {a.foot && (
        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 10, fontStyle: "italic" }}>{a.foot}</div>
      )}
    </div>
  );
}

export default function Copilot({ open, onClose }) {
  const [msgs, setMsgs] = useState([
    {
      role: "ai",
      a: {
        kind: "intro",
        lead: "I'm Manifest's classification copilot.",
        body: "Ask me to classify a good, explain a code's GRI basis, or summarise your review queue. I reason with the same engine that drives the entries — every code is broker-confirmed before filing.",
      },
    },
  ]);
  const [val, setVal] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, open]);

  function ask(text) {
    const q = (text ?? val).trim();
    if (!q) return;
    const answer = reason(q);
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "ai", a: answer }]);
    setVal("");
  }

  if (!open) return null;

  return (
    <>
      {/* scrim */}
      <div
        onClick={onClose}
        className="mf-fade"
        style={{ position: "fixed", inset: 0, background: "rgba(22,33,46,0.28)", zIndex: 40 }}
      />
      {/* panel */}
      <div
        className="mf-slide"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 412,
          maxWidth: "92vw",
          background: C.panel,
          borderLeft: `1px solid ${C.line}`,
          boxShadow: "-12px 0 32px rgba(22,33,46,0.10)",
          zIndex: 41,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="flex items-center justify-between" style={{ padding: "16px 18px", borderBottom: `1px solid ${C.line}` }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: C.stampSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={16} color={C.stamp} />
            </div>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 700 }}>Ask Manifest</div>
              <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, letterSpacing: "0.06em" }}>
                CLASSIFICATION COPILOT · MOCK REASONER
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={C.sub} />
          </button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px" }}>
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex" style={{ justifyContent: "flex-end", marginBottom: 14 }}>
                <div
                  style={{
                    background: C.ink,
                    color: "#fff",
                    fontSize: 13,
                    borderRadius: "12px 12px 3px 12px",
                    padding: "8px 12px",
                    maxWidth: "82%",
                    lineHeight: 1.45,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} style={{ marginBottom: 18 }}>
                <AnswerBlock a={m.a} />
              </div>
            )
          )}
        </div>

        {/* suggestions */}
        {msgs.length <= 1 && (
          <div style={{ padding: "0 18px 8px", display: "flex", flexWrap: "wrap", gap: 7 }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                style={{
                  fontFamily: SANS,
                  fontSize: 11.5,
                  color: C.sub,
                  background: C.panelAlt,
                  border: `1px solid ${C.line}`,
                  borderRadius: 999,
                  padding: "5px 11px",
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: "12px 18px 16px", borderTop: `1px solid ${C.line}` }}>
          <div
            className="flex items-end"
            style={{ gap: 8, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", background: C.panelAlt }}
          >
            <textarea
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask();
                }
              }}
              placeholder="Classify a good, or ask about an entry…"
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: SANS,
                fontSize: 13,
                color: C.ink,
                lineHeight: 1.4,
                maxHeight: 96,
              }}
            />
            <button
              onClick={() => ask()}
              disabled={!val.trim()}
              style={{
                background: val.trim() ? C.stamp : "#EEF0F3",
                border: "none",
                borderRadius: 7,
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: val.trim() ? "pointer" : "default",
                flexShrink: 0,
              }}
            >
              <Send size={14} color={val.trim() ? "#fff" : C.faint} />
            </button>
          </div>
          <div className="flex items-center" style={{ gap: 5, marginTop: 7, color: C.faint }}>
            <CornerDownLeft size={10} />
            <span style={{ fontFamily: MONO, fontSize: 9.5 }}>Enter to send · Shift+Enter for newline · responses are illustrative</span>
          </div>
        </div>
      </div>
    </>
  );
}
