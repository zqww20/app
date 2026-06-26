import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ScrollText, ShieldCheck, Search } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, MonoLabel, PageHeader, Tag } from "../components/ui.jsx";
import { useStore } from "../store/StoreContext.jsx";
import { fmtDate } from "../lib/format.js";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "signoff", label: "Sign-offs" },
  { key: "override", label: "Overrides" },
  { key: "classification", label: "Classification" },
  { key: "release", label: "Release" },
  { key: "accounting", label: "Accounting" },
];

function shipNo(shipments, entityId) {
  const sid = String(entityId).split("/")[0];
  return shipments.find((s) => s.id === sid)?.no || sid;
}

export default function AuditLog() {
  const { audit, shipments } = useStore();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return audit.filter((e) => {
      if (filter === "signoff" && !e.signoff) return false;
      if (filter === "override" && !e.override) return false;
      if (["classification", "release", "accounting"].includes(filter) && !e.action.startsWith(filter)) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        const hay = `${e.actorName} ${e.action} ${e.reason} ${e.field} ${shipNo(shipments, e.entityId)}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [audit, filter, q, shipments]);

  return (
    <div>
      <PageHeader
        eyebrow="COMPLIANCE"
        title="Audit log"
        sub="Append-only record of every material action — who, what, when, prior value, new value, and reason. Immutable and queryable, so any decision can be reconstructed for a compliance review or CBSA audit."
      />

      <div className="flex items-center justify-between" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="flex items-center" style={{ gap: 7, flexWrap: "wrap" }}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ fontFamily: MONO, fontSize: 11.5, color: active ? "#fff" : C.sub, background: active ? C.ink : C.panel, border: `1px solid ${active ? C.ink : C.line}`, borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>{f.label}</button>
            );
          })}
        </div>
        <div className="flex items-center" style={{ gap: 8, border: `1px solid ${C.line}`, background: C.panel, borderRadius: 7, padding: "6px 10px", width: 260 }}>
          <Search size={14} color={C.faint} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the log…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: C.ink, width: "100%" }} />
        </div>
      </div>

      <Panel style={{ overflow: "hidden" }}>
        <div className="flex items-center" style={{ padding: "9px 16px", borderBottom: `1px solid ${C.line}`, background: C.panelAlt }}>
          <div style={{ width: 150 }}><MonoLabel>When</MonoLabel></div>
          <div style={{ width: 150 }}><MonoLabel>Actor</MonoLabel></div>
          <div style={{ width: 150 }}><MonoLabel>Action</MonoLabel></div>
          <div style={{ flex: 1 }}><MonoLabel>Change · reason</MonoLabel></div>
          <div style={{ width: 96 }}><MonoLabel>File</MonoLabel></div>
        </div>
        <div>
          {rows.map((e, i) => {
            const sid = String(e.entityId).split("/")[0];
            return (
              <div key={e.id} className="mf-tr flex items-start" style={{ padding: "11px 16px", borderTop: i ? `1px solid ${C.lineSoft}` : "none", gap: 0 }}>
                <div style={{ width: 150, fontFamily: MONO, fontSize: 10.5, color: C.sub }}>
                  {new Date(e.ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ width: 150 }}>
                  <div className="flex items-center" style={{ gap: 6 }}>
                    {e.signoff && <ShieldCheck size={12} color={C.good} />}
                    <span style={{ fontSize: 12.5, color: C.ink }}>{e.actorName}</span>
                  </div>
                </div>
                <div style={{ width: 150 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.ink }}>{e.action}</span>
                  {e.override && <div style={{ marginTop: 3 }}><Tag tone="alert">OVERRIDE</Tag></div>}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                  {(e.prior != null || e.next != null) && (
                    <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub }}>{e.field}: <span style={{ color: C.faint }}>{e.prior ?? "—"}</span> → <span style={{ color: C.ink }}>{e.next ?? "—"}</span></div>
                  )}
                  {e.reason && <div style={{ fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{e.reason}</div>}
                </div>
                <div style={{ width: 96 }}>
                  {sid.startsWith("shp") ? (
                    <Link to={`/shipments/${sid}`} style={{ fontFamily: MONO, fontSize: 11, color: C.accent, textDecoration: "none" }}>{shipNo(shipments, e.entityId)}</Link>
                  ) : (
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.faint }}>—</span>
                  )}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && <div style={{ padding: 28, textAlign: "center", color: C.sub, fontSize: 13 }}>No matching events.</div>}
        </div>
      </Panel>
    </div>
  );
}
