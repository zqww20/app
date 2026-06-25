import React, { useState } from "react";
import { Database, Lock, Clock } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, MonoLabel, PageHeader, Callout, Tag } from "../components/ui.jsx";
import { REFERENCE_SETS } from "../reference/referenceData.js";
import { ROLES } from "../domain/constants.js";

const SETS = Object.values(REFERENCE_SETS);

function Rows({ set }) {
  if (set.id === "carm") {
    const items = [
      ["Instrument", set.instrument],
      ["Account within", `${set.accountForReleaseWithinBusinessDays} business days of release`],
      ["SOA issued", `Day ${set.soaIssuedDayOfMonth} of month`],
      ["Payment due", set.paymentDueRule],
    ];
    return (
      <div>
        {items.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between" style={{ padding: "8px 0", borderBottom: `1px solid ${C.lineSoft}`, fontSize: 12.5 }}>
            <span style={{ color: C.sub }}>{k}</span><span style={{ fontFamily: MONO, color: C.ink }}>{v}</span>
          </div>
        ))}
      </div>
    );
  }
  if (!set.rows) return null;
  const cols = Object.keys(set.rows[0]);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>{cols.map((c) => <th key={c} style={{ textAlign: "left", padding: "6px 10px", borderBottom: `1px solid ${C.line}` }}><MonoLabel>{c}</MonoLabel></th>)}</tr>
        </thead>
        <tbody>
          {set.rows.map((r, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c} style={{ padding: "7px 10px", borderBottom: `1px solid ${C.lineSoft}`, fontFamily: MONO, color: C.ink, whiteSpace: "nowrap", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {Array.isArray(r[c]) ? r[c].join(", ") : typeof r[c] === "object" && r[c] !== null ? JSON.stringify(r[c]) : String(r[c] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReferenceData() {
  const [openId, setOpenId] = useState(SETS[0].id);

  return (
    <div>
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Reference data"
        sub="Tariff treatments, rates, exchange rates, OGD rules, SIMA measures and CARM parameters — versioned, effective-dated, and editable by authorized staff. No regulatory value is hardcoded; engines resolve through these sets."
      />

      <Callout tone="info" icon={Database} title="Why this exists">
        Regulations change. The build resolves every duty rate, treatment, FX rate, SIMA measure and accounting timeframe through these datasets, so a CBSA change is a data edit — versioned and dated — not a code change. Values shown are illustrative and must be reconciled against the live CBSA sources.
      </Callout>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 11 }}>
        {SETS.map((set) => {
          const open = openId === set.id;
          return (
            <Panel key={set.id} style={{ overflow: "hidden" }}>
              <button onClick={() => setOpenId(open ? null : set.id)} className="flex items-center justify-between" style={{ width: "100%", textAlign: "left", padding: "13px 17px", background: "transparent", border: "none", cursor: "pointer" }}>
                <div className="flex items-center" style={{ gap: 11 }}>
                  <Database size={15} color={C.sub} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{set.title}</div>
                    <div className="flex items-center" style={{ gap: 10, marginTop: 3 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>v{set.version}</span>
                      <span className="inline-flex items-center" style={{ gap: 4, fontFamily: MONO, fontSize: 10.5, color: C.faint }}><Clock size={10} /> eff {set.effective}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center" style={{ gap: 9 }}>
                  {(set.editableBy || []).slice(0, 1).map((r) => <Tag key={r} tone="neutral" icon={Lock}>{ROLES[r]?.short || r}</Tag>)}
                  <span style={{ fontFamily: MONO, fontSize: 11, color: C.faint }}>{open ? "–" : "+"}</span>
                </div>
              </button>
              {open && (
                <div style={{ padding: "0 17px 15px", borderTop: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 11.5, color: C.faint, padding: "10px 0" }}>Source: {set.source}</div>
                  <Rows set={set} />
                  <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 11 }}>
                    Editable by: {(set.editableBy || []).map((r) => ROLES[r]?.label || r).join(", ") || "administrators"}
                  </div>
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
