import React from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, ArrowLeft, ChevronRight, FileText, StickyNote } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, Stat, MonoLabel, StatusBadge, PageHeader, Meta, EmptyState } from "../components/ui.jsx";
import { CLIENTS, clientById, entriesForClient } from "../data/mockData.js";
import { entryStats } from "../lib/entries.js";
import { money0, dayLabel, initials } from "../lib/format.js";

const TIER_TONE = {
  "Key account": { c: C.stamp, bg: C.stampSoft, line: "#E4C6C8" },
  Standard: { c: C.sub, bg: "#EEF0F3", line: C.line },
  New: { c: C.green, bg: C.greenBg, line: C.greenLine },
};

function TierTag({ tier }) {
  const t = TIER_TONE[tier] || TIER_TONE.Standard;
  return (
    <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: t.c, background: t.bg, border: `1px solid ${t.line}`, borderRadius: 999, padding: "3px 9px", letterSpacing: "0.04em" }}>
      {tier.toUpperCase()}
    </span>
  );
}

function Avatar({ name, size = 38 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 9,
        background: C.stampSoft,
        color: C.stamp,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: MONO,
        fontSize: size / 3.2,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

export default function Clients() {
  const { id } = useParams();
  if (id) return <ClientDetail id={id} />;

  return (
    <div>
      <PageHeader
        eyebrow="ACCOUNTS"
        title="Clients"
        sub="Importers of record on the book, with standing instructions the engine applies to every entry."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 13 }}>
        {CLIENTS.map((c, i) => (
          <Link key={c.id} to={`/clients/${c.id}`} style={{ textDecoration: "none" }}>
            <Panel className="mf-row" style={{ padding: "16px 17px", cursor: "pointer", animationDelay: `${i * 50}ms`, height: "100%" }}>
              <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
                <Avatar name={c.name} />
                <TierTag tier={c.tier} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{c.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.faint, marginTop: 4 }}>{c.ref}</div>
              <div className="flex items-center" style={{ gap: 22, marginTop: 14, paddingTop: 13, borderTop: `1px solid ${C.lineSoft}` }}>
                <Stat label="Open" value={c.openEntries} color={c.openEntries ? C.amber : C.sub} />
                <Stat label="YTD entries" value={c.ytdEntries} />
                <Stat label="YTD duty" value={c.ytdDuty > 0 ? money0(c.ytdDuty) : "Free"} />
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ClientDetail({ id }) {
  const client = clientById(id);
  if (!client) {
    return (
      <div>
        <PageHeader title="Client not found" />
        <EmptyState icon={Building2} title={`No client ${id}`}>
          <Link to="/clients" style={{ color: C.stamp }}>Back to clients</Link>.
        </EmptyState>
      </div>
    );
  }
  const entries = entriesForClient(id);

  return (
    <div>
      <Link to="/clients" className="flex items-center" style={{ gap: 6, color: C.sub, fontFamily: MONO, fontSize: 11.5, marginBottom: 14, textDecoration: "none", width: "fit-content" }}>
        <ArrowLeft size={13} /> All clients
      </Link>

      <div className="flex items-start" style={{ gap: 14, marginBottom: 20 }}>
        <Avatar name={client.name} size={46} />
        <div style={{ flex: 1 }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <span style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-0.01em" }}>{client.name}</span>
            <TierTag tier={client.tier} />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.faint, marginTop: 5 }}>{client.ref} · {client.country}</div>
        </div>
      </div>

      <Panel style={{ padding: "16px 20px", marginBottom: 16 }}>
        <div className="flex" style={{ gap: 30, flexWrap: "wrap" }}>
          <Stat label="Open entries" value={client.openEntries} color={client.openEntries ? C.amber : C.sub} />
          <Stat label="YTD entries" value={client.ytdEntries} />
          <Stat label="YTD duty assessed" value={client.ytdDuty > 0 ? money0(client.ytdDuty) : "Free"} />
        </div>
      </Panel>

      {/* standing instruction */}
      <div className="flex" style={{ gap: 11, background: C.blueBg, border: `1px solid ${C.blueLine}`, borderRadius: 8, padding: "12px 15px", marginBottom: 20 }}>
        <StickyNote size={15} color={C.blue} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <MonoLabel color={C.blue} style={{ display: "block", marginBottom: 4 }}>Standing instruction</MonoLabel>
          <div style={{ fontSize: 13, color: "#34465A", lineHeight: 1.5 }}>{client.note}</div>
        </div>
      </div>

      <MonoLabel style={{ display: "block", marginBottom: 10 }}>Entries · {entries.length}</MonoLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((e, i) => {
          const st = entryStats(e);
          return (
            <Link key={e.id} to={`/entries/${e.id}`} style={{ textDecoration: "none" }}>
              <Panel className="mf-row" style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", animationDelay: `${i * 40}ms` }}>
                <div style={{ width: 130, flexShrink: 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600 }}>{e.id}</div>
                  <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>{dayLabel(e.etaOffset)}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.supplier}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint, marginTop: 3 }}>{e.originCountry} → {e.port}</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.ink, width: 90, textAlign: "right", flexShrink: 0 }}>{money0(st.value)}</div>
                <div style={{ width: 140, flexShrink: 0 }}>
                  <StatusBadge status={e.status} size="sm" />
                </div>
                <ChevronRight size={16} color={C.faint} style={{ flexShrink: 0 }} />
              </Panel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
