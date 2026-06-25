import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Boxes, Building2, Database, ScrollText, Sparkles } from "lucide-react";
import { C, MONO, SANS } from "../theme.js";
import { useStore } from "../store/StoreContext.jsx";

/* Navigation is the workflow. The shipment file is the hub; the rest     */
/* are the records and tools around it.                                   */
const NAV = [
  { to: "/", label: "Worklist", icon: LayoutGrid, end: true },
  { to: "/shipments", label: "Shipments", icon: Boxes },
  { to: "/importers", label: "Importers", icon: Building2 },
  { to: "/reference", label: "Reference data", icon: Database },
  { to: "/audit", label: "Audit log", icon: ScrollText },
];

function Item({ to, label, icon: Icon, end, badge }) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <div
          className="flex items-center justify-between"
          style={{
            gap: 10,
            padding: "8px 11px",
            borderRadius: 7,
            marginBottom: 2,
            background: isActive ? C.panel : "transparent",
            border: `1px solid ${isActive ? C.line : "transparent"}`,
            boxShadow: isActive ? "0 1px 2px rgba(26,35,48,0.04)" : "none",
          }}
        >
          <div className="flex items-center" style={{ gap: 10 }}>
            <Icon size={16} color={isActive ? C.accent : C.sub} />
            <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: isActive ? 600 : 500, color: isActive ? C.ink : C.sub }}>{label}</span>
          </div>
          {badge != null && badge > 0 && (
            <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, color: C.sub, background: C.mutedBg, borderRadius: 999, padding: "1px 7px", minWidth: 20, textAlign: "center" }}>
              {badge}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onOpenAssistant }) {
  const { shipments } = useStore();
  const open = shipments.filter((s) => s.state !== "archived").length;
  const pending = shipments.filter((s) => s.state === "pending_release_signoff").length;

  return (
    <aside
      style={{
        width: 234,
        flexShrink: 0,
        background: C.paper,
        borderRight: `1px solid ${C.line}`,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        padding: "16px 13px",
      }}
    >
      <div style={{ padding: "2px 6px 16px" }}>
        <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.25 }}>Customs brokerage</div>
        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", color: C.faint, marginTop: 2 }}>OPERATIONS WORKSPACE</div>
      </div>

      <div>
        {NAV.map((n) => (
          <Item key={n.to} {...n} badge={n.to === "/shipments" ? open : undefined} />
        ))}
      </div>

      <button
        onClick={onOpenAssistant}
        className="flex items-center"
        style={{ gap: 9, marginTop: 14, padding: "9px 11px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer", width: "100%", textAlign: "left" }}
      >
        <Sparkles size={15} color={C.accent} />
        <div>
          <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: C.ink }}>Assistant</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.faint, letterSpacing: "0.03em" }}>proposes · cites · never files</div>
        </div>
      </button>

      <div style={{ flex: 1 }} />

      {pending > 0 && (
        <NavLink to="/shipments?state=pending_release_signoff" style={{ textDecoration: "none" }}>
          <div style={{ background: C.warnBg, border: `1px solid ${C.warnLine}`, borderRadius: 8, padding: "9px 11px" }}>
            <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.warn, letterSpacing: "0.06em" }}>AWAITING SIGN-OFF</div>
            <div style={{ fontSize: 12, color: C.ink, marginTop: 3 }}>
              {pending} file{pending === 1 ? "" : "s"} need a licensed broker
            </div>
          </div>
        </NavLink>
      )}
    </aside>
  );
}
