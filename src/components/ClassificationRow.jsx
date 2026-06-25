import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import { C, MONO } from "../theme.js";
import { isCleared } from "../lib/classify.js";
import { money, pct } from "../lib/format.js";
import { Meta, MonoLabel, ConfidenceBar } from "./ui.jsx";

/* ------------------------------------------------------------------ */
/*  One extracted line + its AI-proposed classification.               */
/*  The unit of the ledger — reused by the classifier intake and the   */
/*  entry detail. `actions` slots in context-specific controls.        */
/* ------------------------------------------------------------------ */

export default function ClassificationRow({ line, cls, index, actions, accentOverride, defaultOpen = false, delay = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  const ok = isCleared(cls.conf);
  const accent = accentOverride || (ok ? C.green : C.amber);
  const aBg = ok ? C.greenBg : C.amberBg;
  const aLine = ok ? C.greenLine : C.amberLine;

  return (
    <div
      className="mf-row"
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        overflow: "hidden",
        animationDelay: `${delay}ms`,
      }}
    >
      {/* extracted line + status */}
      <div className="flex items-start justify-between" style={{ padding: "14px 16px 10px", gap: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3 }}>{line.description}</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.sub, marginTop: 5, marginLeft: 26 }}>
            {(line.quantity || 1)}{" "}
            {line.unit_price != null ? `× ${money(line.unit_price)}${line.currency ? " " + line.currency : ""}` : "units"}
            {line.origin ? `  ·  origin ${line.origin}` : ""}
            {line.material ? `  ·  ${line.material}` : ""}
          </div>
        </div>
        <div
          className="flex items-center"
          style={{ gap: 6, background: aBg, border: `1px solid ${aLine}`, borderRadius: 999, padding: "4px 10px", flexShrink: 0 }}
        >
          {ok ? <CheckCircle2 size={13} color={accent} /> : <AlertTriangle size={13} color={accent} />}
          <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, color: accent, letterSpacing: "0.04em" }}>
            {ok ? "CLEARED TO STAGE" : "REVIEW REQUIRED"}
          </span>
        </div>
      </div>

      {/* code row */}
      <div style={{ borderTop: `1px solid ${C.line}`, padding: "12px 16px", marginLeft: 26 }}>
        <div className="flex items-baseline" style={{ gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 21, fontWeight: 600, letterSpacing: "0.01em", color: cls.hs === "—" ? C.faint : C.ink }}>
            {cls.hs}
          </span>
          <span style={{ fontSize: 13, color: C.sub, lineHeight: 1.35 }}>{cls.h}</span>
        </div>
        <div className="flex items-center" style={{ gap: 18, marginTop: 11, flexWrap: "wrap" }}>
          <Meta k="Treatment" v={cls.t} />
          <Meta k="Duty" v={pct(cls.r)} />
          <ConfidenceBar conf={cls.conf} color={accent} />
        </div>

        {/* expand + actions */}
        <div className="flex items-center justify-between" style={{ marginTop: 12, flexWrap: "wrap", gap: 10 }}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center"
            style={{ gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, color: C.sub, fontFamily: MONO, fontSize: 11.5 }}
          >
            <ChevronRight size={13} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
            {open ? "Hide classification basis" : "Show classification basis"}
          </button>
          {actions}
        </div>

        {open && (
          <div style={{ marginTop: 11, background: aBg, border: `1px solid ${aLine}`, borderRadius: 7, padding: "11px 13px" }}>
            <MonoLabel color={accent} style={{ display: "block", marginBottom: 5 }}>
              General Rules of Interpretation
            </MonoLabel>
            <div style={{ fontSize: 12.5, color: "#4A5260", lineHeight: 1.5 }}>{cls.g}</div>
          </div>
        )}
      </div>
    </div>
  );
}
