import React, { useState, useRef, useEffect } from "react";
import { User, ShieldCheck, Building2, Clock, AlertTriangle, ChevronDown, UserCircle2, Check } from "lucide-react";
import { C, MONO, toneOf } from "../theme.js";
import { OWNERS, urgencyTone } from "../lib/workflow.js";
import { useStore } from "../store/StoreContext.jsx";
import { initials } from "../lib/format.js";

/* Who owns the next action — internal role, the licensed broker, or an    */
/* external chase (the importer). */
export function OwnerChip({ owner, size = "md" }) {
  const o = OWNERS[owner] || OWNERS.none;
  const map = {
    role: { tone: "neutral", icon: User },
    signoff: { tone: "info", icon: ShieldCheck },
    external: { tone: "warn", icon: Building2 },
    none: { tone: "muted", icon: User },
  };
  const cfg = map[o.kind] || map.none;
  const t = toneOf(cfg.tone);
  const Icon = cfg.icon;
  const fs = size === "sm" ? 9.5 : 10;
  return (
    <span className="inline-flex items-center" style={{ gap: 4, background: t.bg, border: `1px solid ${t.line}`, color: t.color, borderRadius: 999, padding: size === "sm" ? "2px 7px" : "3px 8px", fontFamily: MONO, fontSize: fs, fontWeight: 600, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
      <Icon size={size === "sm" ? 10 : 11} color={t.color} />
      {o.kind === "external" ? "AWAITING IMPORTER" : o.kind === "signoff" ? "BROKER SIGN-OFF" : o.label.toUpperCase()}
    </span>
  );
}

/* The clock. Red for arrived/today, amber for soon, quiet otherwise. */
export function DeadlinePill({ urgency, size = "md" }) {
  if (!urgency || urgency.level === "none") return null;
  const t = toneOf(urgencyTone(urgency.level));
  const strong = urgency.level === "overdue" || urgency.level === "today";
  const fs = size === "sm" ? 9.5 : 10.5;
  return (
    <span className="inline-flex items-center" style={{ gap: 4, color: t.color, fontFamily: MONO, fontSize: fs, fontWeight: strong ? 700 : 600, whiteSpace: "nowrap" }}>
      {strong ? <AlertTriangle size={size === "sm" ? 10 : 11} /> : <Clock size={size === "sm" ? 10 : 11} />}
      {urgency.label}
    </span>
  );
}

/* Assignment / handoff control used on the file. */
export function AssignControl({ shipment }) {
  const { users, assignShipment } = useStore();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    function h(e) { if (box.current && !box.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = users.find((u) => u.id === shipment.assigned);

  return (
    <div ref={box} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} className="mf-btn flex items-center" style={{ gap: 7, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 7, padding: "5px 9px 5px 6px", cursor: "pointer" }}>
        {current ? (
          <span style={{ width: 22, height: 22, borderRadius: 999, background: C.accentBg, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 9.5, fontWeight: 600 }}>{initials(current.name)}</span>
        ) : (
          <UserCircle2 size={18} color={C.faint} />
        )}
        <span style={{ fontSize: 12.5, color: current ? C.ink : C.warn, fontWeight: 500 }}>{current ? current.name : "Unassigned"}</span>
        <ChevronDown size={12} color={C.faint} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: 38, right: 0, width: 234, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 9, boxShadow: "0 14px 34px rgba(20,28,38,0.16)", zIndex: 40, overflow: "hidden" }}>
          <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.lineSoft}`, fontFamily: MONO, fontSize: 9, color: C.faint, letterSpacing: "0.08em" }}>HAND OFF TO</div>
          {users.map((u) => {
            const active = u.id === shipment.assigned;
            return (
              <button key={u.id} onClick={() => { assignShipment(shipment.id, u.id); setOpen(false); }} className={active ? "flex items-center justify-between" : "mf-tr flex items-center justify-between"} style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: active ? C.accentBg : "transparent", border: "none", borderTop: `1px solid ${C.lineSoft}`, cursor: "pointer" }}>
                <div>
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 500, color: C.ink }}>{u.name}</span>
                    {u.signoff && <ShieldCheck size={11} color={C.good} />}
                  </div>
                  <div style={{ fontSize: 11, color: C.sub }}>{u.title}</div>
                </div>
                {active && <Check size={13} color={C.accent} />}
              </button>
            );
          })}
          {shipment.assigned && (
            <button onClick={() => { assignShipment(shipment.id, null); setOpen(false); }} className="mf-tr" style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: "transparent", border: "none", borderTop: `1px solid ${C.lineSoft}`, cursor: "pointer", fontSize: 12, color: C.sub }}>
              Unassign
            </button>
          )}
        </div>
      )}
    </div>
  );
}
