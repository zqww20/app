import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, GitBranch, Boxes, Building2, Database, ScrollText, Sparkles } from "lucide-react";
import { C, MONO, SANS } from "../theme.js";
import { useStore } from "../store/StoreContext.jsx";

/* Navigation is the workflow. Queue is where you work; the shipment file  */
/* is the hub; the rest are the pipeline view and supporting records.      */
const NAV = [
  { to: "/", label: "Queue", icon: LayoutGrid, end: true },
  { to: "/pipeline", label: "Pipeline", icon: GitBranch },
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
          className={isActive ? undefined : "mf-nav"}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "8px 11px",
            borderRadius: 7,
            marginBottom: 2,
            ...(isActive ? { background: C.accentBg } : {}),
          }}
        >
          {isActive && <span style={{ position: "absolute", left: -13, top: 7, bottom: 7, width: 3, borderRadius: 999, background: C.accent }} />}
          <div className="flex items-center" style={{ gap: 10 }}>
            <Icon size={16} color={isActive ? C.accent : C.sub} strokeWidth={isActive ? 2.4 : 2} />
            <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: isActive ? 600 : 500, color: isActive ? C.accentStrong : C.sub, letterSpacing: "-0.006em" }}>{label}</span>
          </div>
          {badge != null && badge > 0 && (
            <span className="tnum" style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, color: isActive ? C.accent : C.sub, background: isActive ? "#fff" : C.mutedBg, borderRadius: 999, padding: "1px 7px", minWidth: 20, textAlign: "center" }}>
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
        width: 238,
        flexShrink: 0,
        background: C.panel,
        borderRight: `1px solid ${C.line}`,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        padding: "16px 13px",
      }}
    >
      {/* wordmark */}
      <div className="flex items-center" style={{ gap: 10, padding: "2px 5px 16px" }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="3" width="14" height="18" rx="2" stroke="#fff" strokeWidth="2" />
            <line x1="8.5" y1="8" x2="15.5" y2="8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <line x1="8.5" y1="12" x2="15.5" y2="12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <line x1="8.5" y1="16" x2="13" y2="16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.2, letterSpacing: "-0.01em" }}>Customs brokerage</div>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.07em", color: C.faint, marginTop: 1 }}>OPERATIONS WORKSPACE</div>
        </div>
      </div>

      <div style={{ padding: "0 6px 6px" }}>
        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, letterSpacing: "0.11em", color: C.faint }}>MENU</span>
      </div>
      <div>
        {NAV.map((n) => (
          <Item key={n.to} {...n} badge={n.to === "/shipments" ? open : undefined} />
        ))}
      </div>

      <button
        onClick={onOpenAssistant}
        className="mf-btn flex items-center"
        style={{ gap: 9, marginTop: 14, padding: "9px 11px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer", width: "100%", textAlign: "left", boxShadow: "0 1px 2px rgba(20,28,38,0.04)" }}
      >
        <div style={{ width: 24, height: 24, borderRadius: 6, background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles size={14} color={C.accent} />
        </div>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: C.ink }}>Assistant</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.faint, letterSpacing: "0.02em" }}>proposes · cites · never files</div>
        </div>
      </button>

      <div style={{ flex: 1 }} />

      {pending > 0 && (
        <NavLink to="/shipments?state=pending_release_signoff" style={{ textDecoration: "none" }}>
          <div className="mf-hover" style={{ background: C.warnBg, border: `1px solid ${C.warnLine}`, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: C.warn, letterSpacing: "0.06em" }}>AWAITING SIGN-OFF</div>
            <div style={{ fontSize: 12, color: C.ink, marginTop: 4, lineHeight: 1.4 }}>
              <span className="tnum" style={{ fontWeight: 600 }}>{pending}</span> file{pending === 1 ? "" : "s"} need a licensed broker
            </div>
          </div>
        </NavLink>
      )}
    </aside>
  );
}
