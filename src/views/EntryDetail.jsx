import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Truck,
  Plane,
  Ship,
  ShieldAlert,
  FileText,
  Check,
  Pencil,
  Sparkles,
  Stamp as StampIcon,
  CheckCircle2,
  X,
} from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, Stat, MonoLabel, StatusBadge, PageHeader, Button, Stamp, Meta, EmptyState } from "../components/ui.jsx";
import ClassificationRow from "../components/ClassificationRow.jsx";
import HonestyBanner from "../components/HonestyBanner.jsx";
import { entryById, clientById } from "../data/mockData.js";
import { entryStats } from "../lib/entries.js";
import { money, money0, dayLabel } from "../lib/format.js";
import { isCleared } from "../lib/classify.js";

const MODE_ICON = { Truck, Air: Plane, Ocean: Ship };

export default function EntryDetail({ onOpenCopilot }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const entry = entryById(id);

  // per-line broker decision: { [i]: { state: 'confirmed'|'overridden', code?: string } }
  const [decisions, setDecisions] = useState({});
  const [editing, setEditing] = useState(null);
  const [draftCode, setDraftCode] = useState("");

  if (!entry) {
    return (
      <div>
        <PageHeader title="Entry not found" />
        <EmptyState icon={FileText} title={`No entry ${id}`}>
          It may have been filed or archived. <Link to="/entries" style={{ color: C.stamp }}>Back to entries</Link>.
        </EmptyState>
      </div>
    );
  }

  const st = entryStats(entry);
  const client = clientById(entry.clientId);
  const I = MODE_ICON[entry.mode] || Truck;

  const confirmedCount = Object.values(decisions).filter((d) => d.state === "confirmed" || d.state === "overridden").length;
  const allHandled = confirmedCount === st.count;

  function confirm(i) {
    setDecisions((d) => ({ ...d, [i]: { state: "confirmed" } }));
  }
  function startOverride(i, current) {
    setEditing(i);
    setDraftCode(current === "—" ? "" : current);
  }
  function saveOverride(i) {
    setDecisions((d) => ({ ...d, [i]: { state: "overridden", code: draftCode.trim() || "—" } }));
    setEditing(null);
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center"
        style={{ gap: 6, background: "none", border: "none", cursor: "pointer", color: C.sub, fontFamily: MONO, fontSize: 11.5, marginBottom: 14, padding: 0 }}
      >
        <ArrowLeft size={13} /> Back
      </button>

      <PageHeader
        eyebrow={`${client?.name} · ${client?.ref}`}
        title={`Entry ${entry.id}`}
        sub={`${entry.supplier} · ${entry.incoterm}`}
        right={<StatusBadge status={entry.status} />}
      />

      {/* meta strip */}
      <Panel style={{ padding: "14px 18px", marginBottom: 16 }}>
        <div className="flex items-center" style={{ gap: 26, flexWrap: "wrap" }}>
          <Meta k="Mode" v={<span className="inline-flex items-center" style={{ gap: 5 }}><I size={12} color={C.sub} /> {entry.mode}</span>} />
          <Meta k="Origin" v={entry.originCountry} />
          <Meta k="Port" v={entry.port} />
          <Meta k="ETA" v={dayLabel(entry.etaOffset)} />
          <Meta k="Assigned" v={entry.assigned} vColor={entry.assigned === "Unassigned" ? C.amber : C.ink} />
        </div>
      </Panel>

      {/* summary + stamp */}
      <Panel style={{ padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, overflow: "hidden" }}>
        <div className="flex" style={{ gap: 26, flexWrap: "wrap" }}>
          <Stat label="Line items" value={st.count} />
          <Stat label="Cleared to stage" value={st.cleared} color={C.green} />
          <Stat label="Need review" value={st.review} color={st.review ? C.amber : C.green} />
          <Stat label="Customs value" value={money0(st.value)} />
          <Stat label="Est. duty (illustrative)" value={st.duty > 0 ? money(st.duty) : "Free"} />
          <Stat label="Broker-handled" value={`${confirmedCount} / ${st.count}`} color={allHandled ? C.green : C.sub} />
        </div>
        <div style={{ flexShrink: 0 }}>
          <Stamp
            top={allHandled ? "BROKER-CONFIRMED" : "AI-PROPOSED"}
            bottom={allHandled ? "READY TO FILE" : "PENDING BROKER"}
            color={allHandled ? C.green : C.stamp}
            animate={false}
          />
        </div>
      </Panel>

      <HonestyBanner compact />

      {/* risk flags */}
      {entry.flags.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <MonoLabel style={{ display: "block", marginBottom: 9 }}>AI risk flags · {entry.flags.length}</MonoLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {entry.flags.map((f, i) => {
              const c = f.level === "stamp" ? C.stamp : C.amber;
              const bg = f.level === "stamp" ? C.stampSoft : C.amberBg;
              const line = f.level === "stamp" ? "#E4C6C8" : C.amberLine;
              return (
                <div key={i} className="flex" style={{ gap: 11, background: bg, border: `1px solid ${line}`, borderRadius: 8, padding: "11px 14px" }}>
                  <ShieldAlert size={15} color={c} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 12.5, color: "#4A3A2A", lineHeight: 1.5 }}>{f.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* documents */}
      <div className="flex items-center" style={{ gap: 9, marginBottom: 18, flexWrap: "wrap" }}>
        <MonoLabel>Documents</MonoLabel>
        {entry.docs.map((d) => (
          <span key={d} className="inline-flex items-center" style={{ gap: 6, fontFamily: MONO, fontSize: 11, color: C.sub, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 6, padding: "5px 10px" }}>
            <FileText size={11} color={C.faint} /> {d}
          </span>
        ))}
      </div>

      {/* ledger */}
      <MonoLabel style={{ display: "block", marginBottom: 10 }}>Classification ledger</MonoLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {st.lines.map((line, i) => {
          const cls = line.cls;
          const ok = isCleared(cls.conf);
          const decision = decisions[i];
          const isEditing = editing === i;

          let actions;
          if (decision?.state === "confirmed") {
            actions = (
              <span className="inline-flex items-center" style={{ gap: 6, fontFamily: MONO, fontSize: 10.5, fontWeight: 600, color: C.green, letterSpacing: "0.04em" }}>
                <CheckCircle2 size={13} /> CODE CONFIRMED
              </span>
            );
          } else if (decision?.state === "overridden") {
            actions = (
              <span className="inline-flex items-center" style={{ gap: 6, fontFamily: MONO, fontSize: 10.5, fontWeight: 600, color: C.blue, letterSpacing: "0.04em" }}>
                <Pencil size={12} /> OVERRIDDEN → {decision.code}
              </span>
            );
          } else if (isEditing) {
            actions = (
              <div className="flex items-center" style={{ gap: 7 }}>
                <input
                  value={draftCode}
                  onChange={(e) => setDraftCode(e.target.value)}
                  placeholder="HS code"
                  autoFocus
                  style={{ fontFamily: MONO, fontSize: 12, padding: "6px 9px", border: `1px solid ${C.blue}`, borderRadius: 6, width: 150, outline: "none", color: C.ink }}
                  onKeyDown={(e) => e.key === "Enter" && saveOverride(i)}
                />
                <Button variant="primary" icon={Check} onClick={() => saveOverride(i)} style={{ padding: "6px 11px" }}>
                  Save
                </Button>
                <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.faint }}>
                  <X size={15} />
                </button>
              </div>
            );
          } else {
            actions = (
              <div className="flex items-center" style={{ gap: 8 }}>
                <button
                  onClick={() => startOverride(i, cls.hs)}
                  className="flex items-center"
                  style={{ gap: 6, background: C.panel, border: `1px solid ${C.line}`, color: C.sub, borderRadius: 6, padding: "6px 11px", cursor: "pointer", fontFamily: MONO, fontSize: 11 }}
                >
                  <Pencil size={12} /> Override
                </button>
                <button
                  onClick={() => confirm(i)}
                  className="flex items-center"
                  style={{ gap: 6, background: ok ? C.panel : C.stampSoft, border: `1px solid ${ok ? C.line : C.stamp}`, color: ok ? C.ink : C.stamp, borderRadius: 6, padding: "6px 11px", cursor: "pointer", fontFamily: MONO, fontSize: 11 }}
                >
                  <Check size={12} /> {ok ? "Confirm code" : "Confirm anyway"}
                </button>
              </div>
            );
          }

          return (
            <ClassificationRow
              key={i}
              line={line}
              cls={cls}
              index={i}
              delay={i * 70}
              accentOverride={decision ? (decision.state === "overridden" ? C.blue : C.green) : undefined}
              actions={actions}
            />
          );
        })}
      </div>

      {/* footer actions */}
      <div className="flex items-center justify-between" style={{ marginTop: 20, flexWrap: "wrap", gap: 12 }}>
        <button
          onClick={onOpenCopilot}
          className="flex items-center"
          style={{ gap: 7, background: "none", border: "none", cursor: "pointer", color: C.stamp, fontFamily: MONO, fontSize: 12 }}
        >
          <Sparkles size={13} /> Ask Manifest about this entry
        </button>
        <div className="flex items-center" style={{ gap: 9 }}>
          <Button variant={allHandled ? "default" : "disabled"} disabled={!allHandled} icon={FileText}>
            Export B3 draft
          </Button>
          <Button variant={allHandled ? "stamp" : "disabled"} disabled={!allHandled} icon={StampIcon}>
            {allHandled ? "Stage entry to file" : `Confirm ${st.count - confirmedCount} more to file`}
          </Button>
        </div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
        MOCK CLASSIFICATION ENGINE · CODES ILLUSTRATIVE · NOT A CUSTOMS DECLARATION
      </div>
    </div>
  );
}
