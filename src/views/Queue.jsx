import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ShieldAlert, AlertTriangle, CheckCircle2, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, MonoLabel, StateBadge, PageHeader } from "../components/ui.jsx";
import { OwnerChip, DeadlinePill } from "../components/workflowUi.jsx";
import { useStore } from "../store/StoreContext.jsx";
import { useSession } from "../auth/SessionContext.jsx";
import { nextAction, urgency, priority, actionableByMe } from "../lib/workflow.js";
import { summarize } from "../lib/shipment.js";
import { money0 } from "../lib/format.js";

const SEGMENTS = [
  { key: "needs_me", label: "Needs me" },
  { key: "signoff", label: "Awaiting sign-off" },
  { key: "arriving", label: "Arriving soon" },
  { key: "blocked", label: "Blocked" },
  { key: "all", label: "All active" },
];

export default function Queue() {
  const { shipments, getImporter } = useStore();
  const session = useSession();
  const navigate = useNavigate();

  // build the work model once per render
  const items = useMemo(() => {
    return shipments
      .filter((s) => s.state !== "archived")
      .map((s) => {
        const importer = getImporter(s.importerId);
        const action = nextAction(s, importer);
        const urg = urgency(s);
        const sum = summarize(s);
        return { s, importer, action, urg, sum, prio: priority(s, action, urg) };
      })
      .sort((a, b) => a.prio - b.prio);
  }, [shipments, getImporter]);

  const counts = useMemo(() => {
    const me = { roles: session.currentUser?.roles, hasSignoff: session.hasSignoff };
    return {
      needs_me: items.filter((i) => actionableByMe(i.action, me)).length,
      signoff: items.filter((i) => i.action.needsSignoff).length,
      arriving: items.filter((i) => ["overdue", "today", "soon"].includes(i.urg.level)).length,
      blocked: items.filter((i) => i.action.blocked).length,
      all: items.length,
    };
  }, [items, session]);

  const [seg, setSeg] = useState(() => (counts.needs_me ? "needs_me" : "all"));

  const list = useMemo(() => {
    const me = { roles: session.currentUser?.roles, hasSignoff: session.hasSignoff };
    return items.filter((i) => {
      if (seg === "needs_me") return actionableByMe(i.action, me);
      if (seg === "signoff") return i.action.needsSignoff;
      if (seg === "arriving") return ["overdue", "today", "soon"].includes(i.urg.level);
      if (seg === "blocked") return i.action.blocked;
      return true;
    });
  }, [items, seg, session]);

  // keyboard navigation
  const [sel, setSel] = useState(0);
  useEffect(() => { setSel(0); }, [seg]);
  const open = useCallback((i) => { const it = list[i]; if (it) navigate(`/shipments/${it.s.id}`); }, [list, navigate]);

  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, list.length - 1)); }
      else if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
      else if (e.key === "Enter" || e.key === "o") { e.preventDefault(); open(sel); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [list, sel, open]);

  const greeting = session.currentUser?.name?.split(" ").slice(-1)[0] || "";

  return (
    <div>
      <PageHeader
        eyebrow={`SIGNED IN AS ${session.roleLabels.join(" · ").toUpperCase()}`}
        title="Queue"
        sub="Your work, ordered by what's most urgent. Each file shows the single next action, who owns it, and the clock. Nothing files without a licensed broker's sign-off."
        right={
          <div className="flex items-center" style={{ gap: 8, color: C.faint, fontFamily: MONO, fontSize: 10.5 }}>
            <span className="inline-flex items-center" style={{ gap: 3 }}><ArrowUp size={11} /><ArrowDown size={11} /> move</span>
            <span className="inline-flex items-center" style={{ gap: 3 }}><CornerDownLeft size={11} /> open</span>
          </div>
        }
      />

      {/* segments */}
      <div className="flex items-center" style={{ gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {SEGMENTS.map((sg) => {
          const active = seg === sg.key;
          const n = counts[sg.key];
          const tone = sg.key === "blocked" && n ? C.alert : sg.key === "signoff" && n ? C.accent : null;
          return (
            <button key={sg.key} onClick={() => setSeg(sg.key)} className="mf-btn flex items-center" style={{ gap: 7, fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: active ? "#fff" : tone || C.sub, background: active ? C.ink : C.panel, border: `1px solid ${active ? C.ink : C.line}`, borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>
              {sg.label}
              <span className="tnum" style={{ opacity: 0.85, fontSize: 10.5, color: active ? "#fff" : tone || C.faint }}>{n}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <Panel style={{ padding: "40px 26px", textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: C.goodBg, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 13 }}>
            <CheckCircle2 size={20} color={C.good} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Nothing here{seg === "needs_me" ? " needs you right now" : ""}.</div>
          <div style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>{seg === "needs_me" ? "Switch role, or check Awaiting sign-off and All active." : "The queue is clear for this filter."}</div>
        </Panel>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {list.map((it, i) => {
            const { s, importer, action, urg, sum } = it;
            const selected = i === sel;
            const uTone = urg.level === "overdue" || urg.level === "today" ? C.alert : urg.level === "soon" ? C.warn : "transparent";
            return (
              <div
                key={s.id}
                onClick={() => { setSel(i); navigate(`/shipments/${s.id}`); }}
                onMouseEnter={() => setSel(i)}
                className="mf-row"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "12px 15px 12px 16px",
                  background: selected ? C.accentBg : C.panel,
                  border: `1px solid ${selected ? C.accentLine : C.line}`,
                  borderRadius: 9,
                  cursor: "pointer",
                  boxShadow: selected ? "0 2px 10px rgba(31,91,166,0.10)" : "0 1px 2px rgba(20,28,38,0.04)",
                  animationDelay: `${Math.min(i, 12) * 24}ms`,
                  transition: "background .1s, border-color .1s",
                }}
              >
                <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 999, background: uTone }} />

                {/* deadline / clock */}
                <div style={{ width: 104, flexShrink: 0 }}>
                  <DeadlinePill urgency={urg} />
                  {urg.level === "none" && <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>—</span>}
                </div>

                {/* file + importer */}
                <div style={{ width: 168, flexShrink: 0, minWidth: 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.ink }}>{s.no}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{importer?.legalName}</div>
                </div>

                {/* next action */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    {action.blocked && <ShieldAlert size={13} color={C.alert} style={{ flexShrink: 0 }} />}
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: action.blocked ? C.alert : C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{action.label}</span>
                  </div>
                  <div className="flex items-center" style={{ gap: 8, marginTop: 5 }}>
                    <OwnerChip owner={action.owner} size="sm" />
                    {sum.sima.length > 0 && <Flag tone="alert" icon={ShieldAlert} text="SIMA" />}
                    {sum.ogd.length > 0 && <Flag tone="warn" icon={AlertTriangle} text="OGD" />}
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.supplier}</span>
                  </div>
                </div>

                <div className="tnum" style={{ width: 88, textAlign: "right", flexShrink: 0, fontFamily: MONO, fontSize: 13, fontWeight: 600 }}>{sum.value > 0 ? money0(sum.value) : "—"}</div>
                <div style={{ width: 150, flexShrink: 0 }}><StateBadge state={s.state} size="sm" /></div>
                <ChevronRight size={16} color={selected ? C.accent : C.faint} style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Flag({ tone, icon: Icon, text }) {
  const col = tone === "alert" ? C.alert : C.warn;
  const bg = tone === "alert" ? C.alertBg : C.warnBg;
  const ln = tone === "alert" ? C.alertLine : C.warnLine;
  return (
    <span className="inline-flex items-center" style={{ gap: 3, background: bg, border: `1px solid ${ln}`, color: col, borderRadius: 999, padding: "2px 7px", fontFamily: MONO, fontSize: 9, fontWeight: 600 }}>
      <Icon size={9} /> {text}
    </span>
  );
}
