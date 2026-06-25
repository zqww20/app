import React, { useState } from "react";
import { Search, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, MonoLabel, PageHeader, ConfidenceBar, EmptyState, Meta } from "../components/ui.jsx";
import HonestyBanner from "../components/HonestyBanner.jsx";
import { candidates, isCleared } from "../lib/classify.js";
import { pct } from "../lib/format.js";

const EXAMPLES = [
  "Stainless steel ball valve, 2 inch flanged",
  "Hydraulic gear pump, cast iron",
  "Nitrile cut-resistant gloves",
  "Welded carbon steel pipe, 4 inch",
  "Pressure transmitter 4-20mA",
  "Lithium complex grease cartridge",
];

export default function TariffLookup() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const results = submitted ? candidates(submitted, 5) : [];

  function run(text) {
    const v = (text ?? q).trim();
    setQ(v);
    setSubmitted(v);
  }

  return (
    <div>
      <PageHeader
        eyebrow="TOOLS"
        title="Tariff lookup"
        sub="Describe a good in plain language. The engine returns ranked candidate headings with the GRI reasoning behind each — a side-by-side to inform a classification, not replace it."
      />

      <HonestyBanner compact />

      {/* search box */}
      <Panel style={{ padding: "10px 12px", marginBottom: 14 }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <Search size={17} color={C.faint} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. 316 stainless ball valve, 2 inch, flanged"
            style={{ flex: 1, border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, color: C.ink, background: "transparent" }}
          />
          <button
            onClick={() => run()}
            className="flex items-center"
            style={{ gap: 7, background: C.stamp, border: "none", color: "#fff", borderRadius: 6, padding: "8px 14px", cursor: "pointer", fontFamily: MONO, fontSize: 12 }}
          >
            <Sparkles size={13} /> Classify
          </button>
        </div>
      </Panel>

      {!submitted && (
        <div>
          <MonoLabel style={{ display: "block", marginBottom: 9 }}>Try an example</MonoLabel>
          <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => run(ex)}
                className="flex items-center"
                style={{ gap: 7, fontFamily: "inherit", fontSize: 12.5, color: C.sub, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 999, padding: "7px 13px", cursor: "pointer" }}
              >
                {ex}
                <ArrowRight size={12} color={C.faint} />
              </button>
            ))}
          </div>
        </div>
      )}

      {submitted && results.length === 0 && (
        <EmptyState icon={AlertTriangle} title="No confident match">
          The description doesn't map cleanly to a heading in the demo tariff set. Add the material, function, or
          composition — an essential-character analysis (GRI 3) may be needed once full specs are supplied.
        </EmptyState>
      )}

      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 11 }}>
            <MonoLabel>{results.length} candidate{results.length === 1 ? "" : "s"} · most likely first</MonoLabel>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>QUERY · {submitted}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {results.map((c, i) => {
              const ok = isCleared(c.conf);
              const accent = ok ? C.green : C.amber;
              const lead = i === 0;
              return (
                <Panel
                  key={i}
                  className="mf-row"
                  style={{ padding: "15px 17px", animationDelay: `${i * 60}ms`, border: `1px solid ${lead ? accent + "66" : C.line}` }}
                >
                  <div className="flex items-start justify-between" style={{ gap: 14 }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="flex items-center" style={{ gap: 10, flexWrap: "wrap" }}>
                        {lead && (
                          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", color: accent, background: ok ? C.greenBg : C.amberBg, border: `1px solid ${ok ? C.greenLine : C.amberLine}`, borderRadius: 4, padding: "2px 6px" }}>
                            TOP MATCH
                          </span>
                        )}
                        <span style={{ fontFamily: MONO, fontSize: 21, fontWeight: 600, color: c.hs === "—" ? C.faint : C.ink }}>{c.hs}</span>
                      </div>
                      <div style={{ fontSize: 13.5, color: C.ink, marginTop: 7, fontWeight: 500 }}>{c.h}</div>
                    </div>
                    <div className="flex items-center" style={{ gap: 6, flexShrink: 0 }}>
                      {ok ? <CheckCircle2 size={14} color={accent} /> : <AlertTriangle size={14} color={accent} />}
                      <ConfidenceBar conf={c.conf} color={accent} width={72} />
                    </div>
                  </div>

                  <div className="flex items-center" style={{ gap: 18, marginTop: 12, flexWrap: "wrap" }}>
                    <Meta k="Treatment" v={c.t} />
                    <Meta k="Duty" v={pct(c.r)} />
                  </div>

                  <div style={{ marginTop: 12, background: ok ? C.greenBg : C.amberBg, border: `1px solid ${ok ? C.greenLine : C.amberLine}`, borderRadius: 7, padding: "10px 12px" }}>
                    <MonoLabel color={accent} style={{ display: "block", marginBottom: 5 }}>
                      General Rules of Interpretation
                    </MonoLabel>
                    <div style={{ fontSize: 12.5, color: "#4A5260", lineHeight: 1.5 }}>{c.g}</div>
                  </div>
                </Panel>
              );
            })}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>
            ILLUSTRATIVE CANDIDATES · CONFIRM AGAINST THE LIVE TARIFF · NOT CUSTOMS ADVICE
          </div>
        </div>
      )}
    </div>
  );
}
