import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ScanLine,
  Stamp as StampIcon,
  FileCheck2,
  Truck,
  Plane,
  Ship,
  Clock,
} from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, Stat, MonoLabel, StatusBadge, PageHeader } from "../components/ui.jsx";
import { ENTRIES, ACTIVITY, clientById } from "../data/mockData.js";
import { workspaceStats, entryStats } from "../lib/entries.js";
import { money0, dayLabel } from "../lib/format.js";

const MODE_ICON = { Truck, Air: Plane, Ocean: Ship };

function modeIcon(mode) {
  const I = MODE_ICON[mode] || Truck;
  return <I size={13} color={C.faint} />;
}

function timeAgo(mins) {
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

const ACTIVITY_TONE = {
  ai: { c: C.blue, label: "AI" },
  flag: { c: C.amber, label: "FLAG" },
  broker: { c: C.green, label: "BROKER" },
  hold: { c: C.stamp, label: "HOLD" },
  filed: { c: C.green, label: "FILED" },
};

export default function Dashboard({ onOpenCopilot }) {
  const ws = workspaceStats(ENTRIES);

  // entries that need a human: review + hold + intake, soonest ETA first
  const queue = ENTRIES.filter((e) => ["review", "hold", "intake", "classifying"].includes(e.status)).sort(
    (a, b) => a.etaOffset - b.etaOffset
  );

  // all AI risk flags across entries
  const flags = ENTRIES.flatMap((e) => e.flags.map((f) => ({ ...f, entry: e.id, client: clientById(e.clientId)?.name })));

  return (
    <div>
      <PageHeader
        eyebrow="OPERATIONS · TODAY"
        title="Clearance desk"
        sub="Live view of every entry moving through extraction, AI classification, and broker review. Nothing here is filed until a licensed broker signs the codes."
        right={<StatusBadge status="review" />}
      />

      {/* AI digest */}
      <Panel style={{ padding: 0, overflow: "hidden", marginBottom: 18 }}>
        <div
          style={{
            background: "linear-gradient(120deg,#FBFAF6 0%, #FFFFFF 60%)",
            padding: "16px 18px",
            display: "flex",
            gap: 13,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: C.stampSoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles size={17} color={C.stamp} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
              <MonoLabel style={{ color: C.stamp }}>Morning digest · AI-generated</MonoLabel>
            </div>
            <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.6 }}>
              <b>{ws.open} entries are open</b> and {ws.linesNeedingReview} line
              {ws.linesNeedingReview === 1 ? "" : "s"} across them need your sign-off. Two carry origin
              risk: <Link to="/entries/ENT-24817" style={{ color: C.stamp, fontWeight: 600 }}>ENT-24817</Link> has an
              India-origin gasket breaking its CUSMA claim, and{" "}
              <Link to="/entries/ENT-24822" style={{ color: C.stamp, fontWeight: 600 }}>ENT-24822</Link> brings
              Indian carbon-steel pipe that should be screened against SIMA before staging.{" "}
              <Link to="/entries/ENT-24811" style={{ color: C.stamp, fontWeight: 600 }}>ENT-24811</Link> is held
              pending a CUSMA certificate. Estimated assessed duty across open entries is{" "}
              <b>{ws.duty > 0 ? money0(ws.duty) : "free"}</b> (illustrative).
            </div>
            <button
              onClick={onOpenCopilot}
              className="flex items-center"
              style={{ gap: 6, marginTop: 11, background: "none", border: "none", cursor: "pointer", padding: 0, color: C.stamp, fontFamily: MONO, fontSize: 11.5 }}
            >
              Ask a follow-up <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </Panel>

      {/* stat row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <StatCard icon={ScanLine} label="Open entries" value={ws.open} tone={C.ink} to="/entries" />
        <StatCard icon={ScanLine} label="In classification" value={ws.intake} tone={C.blue} to="/entries" />
        <StatCard icon={StampIcon} label="Awaiting broker" value={ws.inReview} tone={C.amber} to="/review" />
        <StatCard icon={ShieldAlert} label="On hold" value={ws.onHold} tone={C.stamp} to="/entries" />
        <StatCard icon={FileCheck2} label="Filed this week" value={ws.filed} tone={C.green} to="/entries" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, alignItems: "start" }}>
        {/* work queue */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <MonoLabel>Needs attention · {queue.length}</MonoLabel>
            <Link to="/entries" style={{ fontFamily: MONO, fontSize: 11, color: C.sub, textDecoration: "none" }}>
              All entries →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {queue.map((e) => {
              const st = entryStats(e);
              const client = clientById(e.clientId);
              return (
                <Link key={e.id} to={`/entries/${e.id}`} style={{ textDecoration: "none" }}>
                  <Panel
                    className="mf-row"
                    style={{ padding: "13px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer" }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="flex items-center" style={{ gap: 9 }}>
                        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{e.id}</span>
                        <StatusBadge status={e.status} size="sm" />
                      </div>
                      <div style={{ fontSize: 13, color: C.ink, marginTop: 5, fontWeight: 500 }}>{client?.name}</div>
                      <div className="flex items-center" style={{ gap: 8, marginTop: 4, color: C.sub, fontFamily: MONO, fontSize: 11 }}>
                        {modeIcon(e.mode)}
                        <span>{e.supplier}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.ink }}>{money0(st.value)}</div>
                      <div style={{ fontSize: 11, color: st.review > 0 ? C.amber : C.green, marginTop: 4, fontFamily: MONO }}>
                        {st.review > 0 ? `${st.review} to review` : "all cleared"}
                      </div>
                      <div className="flex items-center" style={{ gap: 4, justifyContent: "flex-end", marginTop: 4, color: C.faint, fontFamily: MONO, fontSize: 10.5 }}>
                        <Clock size={10} /> ETA {dayLabel(e.etaOffset)}
                      </div>
                    </div>
                  </Panel>
                </Link>
              );
            })}
          </div>
        </div>

        {/* right column: flags + activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <MonoLabel style={{ display: "block", marginBottom: 10 }}>AI risk flags · {flags.length}</MonoLabel>
            <Panel style={{ padding: "6px 0" }}>
              {flags.map((f, i) => (
                <Link key={i} to={`/entries/${f.entry}`} style={{ textDecoration: "none" }}>
                  <div
                    className="flex"
                    style={{
                      gap: 10,
                      padding: "11px 15px",
                      borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                      cursor: "pointer",
                    }}
                  >
                    <ShieldAlert size={14} color={f.level === "stamp" ? C.stamp : C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div className="flex items-center" style={{ gap: 7 }}>
                        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.ink }}>{f.entry}</span>
                        <span style={{ fontSize: 11, color: C.faint }}>{f.client}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.sub, marginTop: 3, lineHeight: 1.45 }}>{f.text}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </Panel>
          </div>

          <div>
            <MonoLabel style={{ display: "block", marginBottom: 10 }}>Activity</MonoLabel>
            <Panel style={{ padding: "6px 0" }}>
              {ACTIVITY.map((a, i) => {
                const tone = ACTIVITY_TONE[a.kind] || ACTIVITY_TONE.ai;
                return (
                  <div
                    key={a.id}
                    className="flex"
                    style={{ gap: 10, padding: "10px 15px", borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 8.5,
                        fontWeight: 600,
                        color: tone.c,
                        background: `${tone.c}14`,
                        borderRadius: 4,
                        padding: "2px 5px",
                        height: "fit-content",
                        letterSpacing: "0.06em",
                        flexShrink: 0,
                        minWidth: 44,
                        textAlign: "center",
                      }}
                    >
                      {tone.label}
                    </span>
                    <div>
                      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.45 }}>{a.text}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 3 }}>{timeAgo(a.minsAgo)}</div>
                    </div>
                  </div>
                );
              })}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone, to }) {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <Panel style={{ padding: "14px 15px", cursor: "pointer" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <Icon size={15} color={tone} />
        </div>
        <Stat label={label} value={value} color={tone} />
      </Panel>
    </Link>
  );
}
