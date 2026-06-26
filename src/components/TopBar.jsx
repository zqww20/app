import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, ChevronDown, ShieldCheck, Sparkles, Boxes, Building2, FileText } from "lucide-react";
import { C, MONO, SANS } from "../theme.js";
import { useSession } from "../auth/SessionContext.jsx";
import { useStore } from "../store/StoreContext.jsx";
import { initials } from "../lib/format.js";

function useOutside(ref, onClose) {
  useEffect(() => {
    function h(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onClose]);
}

function GlobalSearch() {
  const { shipments, importers } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const box = useRef(null);
  useOutside(box, () => setOpen(false));

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const out = [];
    for (const imp of importers) {
      if (imp.legalName.toLowerCase().includes(s) || imp.businessNumber.includes(s))
        out.push({ kind: "importer", id: imp.id, label: imp.legalName, sub: `BN ${imp.businessNumber}`, to: `/importers/${imp.id}` });
    }
    for (const shp of shipments) {
      const imp = importers.find((i) => i.id === shp.importerId);
      if (shp.no.toLowerCase().includes(s) || shp.supplier.toLowerCase().includes(s) || imp?.legalName.toLowerCase().includes(s))
        out.push({ kind: "shipment", id: shp.id, label: shp.no, sub: `${imp?.legalName || ""} · ${shp.supplier}`, to: `/shipments/${shp.id}` });
      for (const ln of shp.lines || []) {
        if (ln.description.toLowerCase().includes(s)) {
          out.push({ kind: "line", id: shp.id + ln.id, label: ln.description, sub: `${shp.no} · line item`, to: `/shipments/${shp.id}` });
          break;
        }
      }
    }
    return out.slice(0, 8);
  }, [q, shipments, importers]);

  const ICON = { importer: Building2, shipment: Boxes, line: FileText };

  return (
    <div ref={box} style={{ position: "relative", width: 360, maxWidth: "42vw" }}>
      <div className="flex items-center" style={{ gap: 9, border: `1px solid ${focus ? C.accent : C.line}`, background: C.panel, borderRadius: 8, padding: "7px 11px", boxShadow: focus ? `0 0 0 3px ${C.accentBg}` : "none", transition: "border-color .12s, box-shadow .12s" }}>
        <Search size={14} color={focus ? C.accent : C.faint} />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setFocus(true); }}
          onBlur={() => setFocus(false)}
          placeholder="Search shipments, importers, line items…"
          style={{ border: "none", outline: "none", background: "transparent", fontFamily: SANS, fontSize: 13, color: C.ink, width: "100%" }}
        />
      </div>
      {open && q.trim() && (
        <div style={{ position: "absolute", top: 42, left: 0, right: 0, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 9, boxShadow: "0 14px 34px rgba(20,28,38,0.14)", zIndex: 50, overflow: "hidden" }}>
          {results.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 12.5, color: C.faint }}>No matches.</div>
          ) : (
            results.map((r, i) => {
              const I = ICON[r.kind] || FileText;
              return (
                <button
                  key={i}
                  onMouseDown={() => { navigate(r.to); setOpen(false); setQ(""); }}
                  className="mf-tr flex items-center"
                  style={{ gap: 10, width: "100%", textAlign: "left", padding: "9px 13px", background: "transparent", border: "none", borderTop: i ? `1px solid ${C.lineSoft}` : "none", cursor: "pointer" }}
                >
                  <I size={14} color={C.sub} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>{r.sub}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
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

export default function TopBar({ onOpenAssistant }) {
  const { pathname } = useLocation();
  const crumb = pathname === "/" ? "Worklist" : pathname.split("/").filter(Boolean).map((s) => s.replace(/-/g, " ")).map((s) => s[0].toUpperCase() + s.slice(1)).join("  ›  ");

  return (
    <div className="flex items-center justify-between" style={{ height: 56, flexShrink: 0, borderBottom: `1px solid ${C.line}`, background: C.panel, padding: "0 22px", position: "sticky", top: 0, zIndex: 30, boxShadow: "0 1px 2px rgba(20,28,38,0.03)" }}>
      <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: C.sub, letterSpacing: "0.02em" }}>{crumb}</span>
      <div className="flex items-center" style={{ gap: 12 }}>
        <GlobalSearch />
        <button onClick={onOpenAssistant} className="mf-btn flex items-center" style={{ gap: 6, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: C.accent, background: C.accentBg, border: `1px solid ${C.accentLine}`, borderRadius: 7, padding: "7px 12px", cursor: "pointer" }}>
          <Sparkles size={13} /> Assistant
        </button>
        <RoleSwitcher />
      </div>
    </div>
  );
}
