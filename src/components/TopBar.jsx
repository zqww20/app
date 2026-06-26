import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, ChevronDown, ShieldCheck, Sparkles } from "lucide-react";
import { C, MONO, SANS } from "../theme.js";
import { useSession } from "../auth/SessionContext.jsx";
import { initials } from "../lib/format.js";

function useOutside(ref, onClose) {
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onClose]);
}

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

/* The top-bar search is the command palette's doorway — one search box,   */
/* keyboard or mouse. */
function SearchTrigger({ onOpen }) {
  return (
    <button onClick={onOpen} className="mf-btn flex items-center justify-between" style={{ width: 340, maxWidth: "40vw", gap: 9, border: `1px solid ${C.line}`, background: C.panel, borderRadius: 8, padding: "7px 10px", cursor: "pointer", boxShadow: "0 1px 2px rgba(20,28,38,0.04)" }}>
      <span className="flex items-center" style={{ gap: 9, color: C.faint }}>
        <Search size={14} />
        <span style={{ fontFamily: SANS, fontSize: 13 }}>Search files, importers, or jump to…</span>
      </span>
      <kbd style={{ fontFamily: MONO, fontSize: 10, color: C.sub, border: `1px solid ${C.line}`, borderRadius: 4, padding: "1px 6px", background: C.panelAlt }}>{IS_MAC ? "⌘" : "Ctrl"} K</kbd>
    </button>
  );
}

function RoleSwitcher() {
  const { users, currentUser, setCurrentUserId, hasSignoff, roleLabels } = useSession();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useOutside(box, () => setOpen(false));

  return (
    <div ref={box} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} className="mf-btn flex items-center" style={{ gap: 9, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "5px 9px 5px 6px", cursor: "pointer", boxShadow: "0 1px 2px rgba(20,28,38,0.04)" }}>
        <div style={{ width: 26, height: 26, borderRadius: 999, background: C.accentBg, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 10.5, fontWeight: 600 }}>
          {initials(currentUser?.name)}
        </div>
        <div style={{ textAlign: "left", lineHeight: 1.2 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{currentUser?.name}</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.faint }}>{roleLabels[0] || "—"}{roleLabels.length > 1 ? ` +${roleLabels.length - 1}` : ""}</div>
        </div>
        {hasSignoff && <ShieldCheck size={14} color={C.good} />}
        <ChevronDown size={13} color={C.faint} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: 44, right: 0, width: 274, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, boxShadow: "0 14px 34px rgba(20,28,38,0.16)", zIndex: 50, overflow: "hidden" }}>
          <div style={{ padding: "9px 13px", borderBottom: `1px solid ${C.lineSoft}` }}>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, color: C.faint, letterSpacing: "0.08em" }}>ACTING AS — SWITCH ROLE</div>
          </div>
          {users.map((u) => {
            const active = u.id === currentUser?.id;
            return (
              <button key={u.id} onClick={() => { setCurrentUserId(u.id); setOpen(false); }} className={active ? "flex items-center justify-between" : "mf-tr flex items-center justify-between"} style={{ width: "100%", textAlign: "left", padding: "9px 13px", background: active ? C.accentBg : "transparent", border: "none", borderTop: `1px solid ${C.lineSoft}`, cursor: "pointer" }}>
                <div>
                  <div className="flex items-center" style={{ gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: C.ink }}>{u.name}</span>
                    {u.signoff && <ShieldCheck size={12} color={C.good} />}
                  </div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{u.title}</div>
                </div>
              </button>
            );
          })}
          <div style={{ padding: "9px 13px", borderTop: `1px solid ${C.lineSoft}`, fontSize: 10.5, color: C.faint, lineHeight: 1.5 }}>
            Sign-off authority (<ShieldCheck size={10} color={C.good} style={{ display: "inline", verticalAlign: "-1px" }} />) is an explicit permission. Only a licensed broker can file with CBSA.
          </div>
        </div>
      )}
    </div>
  );
}

export default function TopBar({ onOpenAssistant, onOpenPalette }) {
  const { pathname } = useLocation();
  const crumb = pathname === "/" ? "Queue" : pathname.split("/").filter(Boolean).map((s) => s.replace(/-/g, " ")).map((s) => s[0].toUpperCase() + s.slice(1)).join("  ›  ");

  return (
    <div className="flex items-center justify-between" style={{ height: 56, flexShrink: 0, borderBottom: `1px solid ${C.line}`, background: C.panel, padding: "0 22px", position: "sticky", top: 0, zIndex: 30, boxShadow: "0 1px 2px rgba(20,28,38,0.03)" }}>
      <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: C.sub, letterSpacing: "0.02em" }}>{crumb}</span>
      <div className="flex items-center" style={{ gap: 12 }}>
        <SearchTrigger onOpen={onOpenPalette} />
        <button onClick={onOpenAssistant} className="mf-btn flex items-center" style={{ gap: 6, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: C.accent, background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 7, padding: "7px 12px", cursor: "pointer" }}>
          <Sparkles size={13} /> Assistant
        </button>
        <RoleSwitcher />
      </div>
    </div>
  );
}
