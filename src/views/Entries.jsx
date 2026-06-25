import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Truck, Plane, Ship, ChevronRight, Plus } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, MonoLabel, StatusBadge, PageHeader, Button } from "../components/ui.jsx";
import { ENTRIES, clientById } from "../data/mockData.js";
import { entryStats } from "../lib/entries.js";
import { money0, dayLabel } from "../lib/format.js";

const MODE_ICON = { Truck, Air: Plane, Ocean: Ship };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "intake", label: "Intake" },
  { key: "classifying", label: "Classifying" },
  { key: "review", label: "Broker review" },
  { key: "staged", label: "Staged" },
  { key: "hold", label: "On hold" },
  { key: "filed", label: "Filed" },
];

export default function Entries() {
  const [filter, setFilter] = useState("all");
  const rows = ENTRIES.filter((e) => filter === "all" || e.status === filter).sort(
    (a, b) => a.etaOffset - b.etaOffset
  );

  return (
    <div>
      <PageHeader
        eyebrow="OPERATIONS"
        title="Entries"
        sub="Every commercial invoice in the pipeline, from intake through filing. Click an entry to open its line-item workspace."
        right={
          <Link to="/classify" style={{ textDecoration: "none" }}>
            <Button variant="stamp" icon={Plus}>
              New entry from invoice
            </Button>
          </Link>
        }
      />

      {/* filter chips */}
      <div className="flex items-center" style={{ gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const count = f.key === "all" ? ENTRIES.length : ENTRIES.filter((e) => e.status === f.key).length;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex items-center"
              style={{
                gap: 7,
                fontFamily: MONO,
                fontSize: 11.5,
                color: active ? "#fff" : C.sub,
                background: active ? C.ink : C.panel,
                border: `1px solid ${active ? C.ink : C.line}`,
                borderRadius: 999,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              {f.label}
              <span style={{ opacity: 0.7, fontSize: 10.5 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* table header */}
      <div
        className="flex items-center"
        style={{ padding: "0 16px 9px", gap: 12 }}
      >
        <HeadCell w={160}>Entry · Client</HeadCell>
        <HeadCell flex>Supplier · Route</HeadCell>
        <HeadCell w={92} right>Value</HeadCell>
        <HeadCell w={108} right>Lines</HeadCell>
        <HeadCell w={140}>Status</HeadCell>
        <HeadCell w={74} right>ETA</HeadCell>
        <div style={{ width: 16 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((e, i) => {
          const st = entryStats(e);
          const client = clientById(e.clientId);
          const I = MODE_ICON[e.mode] || Truck;
          return (
            <Link key={e.id} to={`/entries/${e.id}`} style={{ textDecoration: "none" }}>
              <Panel
                className="mf-row"
                style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", animationDelay: `${i * 40}ms` }}
              >
                <div style={{ width: 160, flexShrink: 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{e.id}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {client?.name}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {e.supplier}
                  </div>
                  <div className="flex items-center" style={{ gap: 7, marginTop: 3, color: C.faint, fontFamily: MONO, fontSize: 10.5 }}>
                    <I size={12} />
                    <span>{e.originCountry}</span>
                    <span style={{ color: C.line }}>→</span>
                    <span>{e.port}</span>
                  </div>
                </div>

                <div style={{ width: 92, textAlign: "right", flexShrink: 0, fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.ink }}>
                  {money0(st.value)}
                </div>

                <div style={{ width: 108, textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: C.ink }}>{st.count}</span>
                  {st.review > 0 ? (
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.amber, marginLeft: 6 }}>{st.review} flag{st.review === 1 ? "" : "s"}</span>
                  ) : (
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.green, marginLeft: 6 }}>clear</span>
                  )}
                </div>

                <div style={{ width: 140, flexShrink: 0 }}>
                  <StatusBadge status={e.status} size="sm" />
                </div>

                <div style={{ width: 74, textAlign: "right", flexShrink: 0, fontFamily: MONO, fontSize: 11, color: e.etaOffset < 0 ? C.faint : C.sub }}>
                  {dayLabel(e.etaOffset)}
                </div>

                <ChevronRight size={16} color={C.faint} style={{ flexShrink: 0 }} />
              </Panel>
            </Link>
          );
        })}
        {rows.length === 0 && (
          <Panel style={{ padding: "32px", textAlign: "center", color: C.sub, fontSize: 13 }}>
            No entries in this state.
          </Panel>
        )}
      </div>
    </div>
  );
}

function HeadCell({ children, w, flex, right }) {
  return (
    <div style={{ width: flex ? undefined : w, flex: flex ? 1 : undefined, textAlign: right ? "right" : "left", flexShrink: 0 }}>
      <MonoLabel>{children}</MonoLabel>
    </div>
  );
}
