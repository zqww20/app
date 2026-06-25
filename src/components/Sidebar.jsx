import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Inbox,
  ScanLine,
  Stamp as StampIcon,
  Search,
  Building2,
  Sparkles,
} from "lucide-react";
import { C, MONO, SANS } from "../theme.js";
import { BROKER, ENTRIES } from "../data/mockData.js";
import { initials } from "../lib/format.js";

const reviewCount = ENTRIES.filter((e) => e.status === "review").length;
const intakeCount = ENTRIES.filter((e) => e.status === "intake" || e.status === "classifying").length;

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true },
  { to: "/entries", label: "Entries", icon: Inbox, badge: ENTRIES.length },
  { to: "/classify", label: "Classify invoice", icon: ScanLine },
  { to: "/review", label: "Broker review", icon: StampIcon, badge: reviewCount, badgeColor: C.amber },
  { to: "/lookup", label: "Tariff lookup", icon: Search },
  { to: "/clients", label: "Clients", icon: Building2 },
];

function Item({ to, label, icon: Icon, end, badge, badgeColor }) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <div
          className="flex items-center justify-between"
          style={{
            gap: 10,
            padding: "9px 12px",
            borderRadius: 7,
            marginBottom: 2,
            background: isActive ? "#fff" : "transparent",
            border: `1px solid ${isActive ? C.line : "transparent"}`,
            boxShadow: isActive ? "0 1px 2px rgba(22,33,46,0.04)" : "none",
            transition: "background .12s",
          }}
        >
          <div className="flex items-center" style={{ gap: 10 }}>
            <Icon size={16} color={isActive ? C.stamp : C.sub} />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? C.ink : C.sub,
              }}
            >
              {label}
            </span>
          </div>
          {badge != null && badge > 0 && (
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                fontWeight: 600,
                color: badgeColor || C.faint,
                background: badgeColor ? `${badgeColor}1A` : "#EEF0F3",
                borderRadius: 999,
                padding: "1px 7px",
                minWidth: 20,
                textAlign: "center",
              }}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onOpenCopilot }) {
  return (
    <aside
      style={{
        width: 246,
        flexShrink: 0,
        background: C.paper,
        borderRight: `1px solid ${C.line}`,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        padding: "18px 14px",
      }}
    >
      {/* brand */}
      <div className="flex items-center" style={{ gap: 11, padding: "2px 4px 18px" }}>
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: "0.34em",
            color: C.stamp,
            border: `1.5px solid ${C.stamp}`,
            padding: "5px 8px 5px 11px",
            borderRadius: 3,
          }}
        >
          MANIFEST
        </div>
        <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.16em", color: C.faint, lineHeight: 1.5 }}>
          AI CUSTOMS
          <br />
          WORKSPACE
        </div>
      </div>

      <div style={{ paddingTop: 4 }}>
        <div style={{ padding: "0 8px 7px" }}>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: C.faint }}>
            OPERATIONS
          </span>
        </div>
        {NAV.map((n) => (
          <Item key={n.to} {...n} />
        ))}
      </div>

      {/* copilot launcher */}
      <button
        onClick={onOpenCopilot}
        className="flex items-center"
        style={{
          gap: 9,
          marginTop: 16,
          padding: "10px 12px",
          borderRadius: 8,
          border: `1px solid ${C.line}`,
          background: "linear-gradient(180deg,#FFFFFF, #FBFAF6)",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
        }}
      >
        <Sparkles size={15} color={C.stamp} />
        <div>
          <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: C.ink }}>Ask Manifest</div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, letterSpacing: "0.04em" }}>
            AI classification copilot
          </div>
        </div>
      </button>

      <div style={{ flex: 1 }} />

      {/* broker badge */}
      <div
        className="flex items-center"
        style={{ gap: 10, padding: "10px 8px", borderTop: `1px solid ${C.line}`, marginTop: 12 }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            background: C.stampSoft,
            color: C.stamp,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initials(BROKER.name)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {BROKER.name}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint }}>{BROKER.licence}</div>
        </div>
      </div>
    </aside>
  );
}
