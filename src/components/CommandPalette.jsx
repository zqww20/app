import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Boxes, Building2, LayoutGrid, GitBranch, Database, ScrollText, Plus, CornerDownLeft, ArrowUp, ArrowDown, FileText } from "lucide-react";
import { C, MONO, SANS } from "../theme.js";
import { useStore } from "../store/StoreContext.jsx";

/* ------------------------------------------------------------------ */
/*  Command palette (Cmd/Ctrl+K). Jump to any file or importer, or run   */
/*  a navigation/action — the keyboard spine for people who live here.   */
/* ------------------------------------------------------------------ */

const NAV = [
  { id: "n-queue", group: "Go to", label: "Queue", icon: LayoutGrid, to: "/" },
  { id: "n-pipe", group: "Go to", label: "Pipeline", icon: GitBranch, to: "/pipeline" },
  { id: "n-ship", group: "Go to", label: "Shipments", icon: Boxes, to: "/shipments" },
  { id: "n-imp", group: "Go to", label: "Importers", icon: Building2, to: "/importers" },
  { id: "n-ref", group: "Go to", label: "Reference data", icon: Database, to: "/reference" },
  { id: "n-aud", group: "Go to", label: "Audit log", icon: ScrollText, to: "/audit" },
  { id: "a-new", group: "Actions", label: "New shipment", icon: Plus, to: "/shipments?new=1" },
];

export default function CommandPalette({ open, onClose }) {
  const { shipments, importers } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 20); }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const ship = shipments.map((sh) => {
      const imp = importers.find((i) => i.id === sh.importerId);
      return { id: `s-${sh.id}`, group: "Shipments", label: sh.no, sub: `${imp?.legalName || ""} · ${sh.supplier}`, icon: Boxes, to: `/shipments/${sh.id}`, hay: `${sh.no} ${imp?.legalName} ${sh.supplier} ${(sh.lines || []).map((l) => l.description).join(" ")}`.toLowerCase() };
    });
    const imps = importers.map((i) => ({ id: `i-${i.id}`, group: "Importers", label: i.legalName, sub: `BN ${i.businessNumber}`, icon: Building2, to: `/importers/${i.id}`, hay: `${i.legalName} ${i.businessNumber}`.toLowerCase() }));
    const nav = NAV.map((n) => ({ ...n, hay: `${n.group} ${n.label}`.toLowerCase() }));

    if (!s) return [...nav, ...ship.slice(0, 5)];
    const score = (c) => {
      const h = c.hay;
      if (!h.includes(s)) return -1;
      let sc = 0;
      if (c.label.toLowerCase().startsWith(s)) sc += 5;
      if (c.label.toLowerCase().includes(s)) sc += 3;
      return sc + 1;
    };
    return [...nav, ...ship, ...imps]
      .map((c) => ({ c, sc: score(c) }))
      .filter((x) => x.sc >= 0)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 9)
      .map((x) => x.c);
  }, [q, shipments, importers]);

  useEffect(() => { setSel(0); }, [q]);

  function go(item) { if (!item) return; onClose(); navigate(item.to); }

  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(results[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  }

  if (!open) return null;

  let lastGroup = null;
  return (
    <>
      <div onClick={onClose} className="mf-fade" style={{ position: "fixed", inset: 0, background: "rgba(20,28,38,0.34)", zIndex: 60 }} />
      <div className="mf-fade" style={{ position: "fixed", top: "12vh", left: "50%", transform: "translateX(-50%)", width: 560, maxWidth: "94vw", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 24px 60px rgba(20,28,38,0.28)", zIndex: 61, overflow: "hidden" }}>
        <div className="flex items-center" style={{ gap: 11, padding: "13px 16px", borderBottom: `1px solid ${C.line}` }}>
          <Search size={17} color={C.faint} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search files, importers, or jump to…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: SANS, fontSize: 15, color: C.ink }}
          />
          <kbd style={{ fontFamily: MONO, fontSize: 10, color: C.faint, border: `1px solid ${C.line}`, borderRadius: 4, padding: "2px 6px" }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: "52vh", overflowY: "auto", padding: 6 }}>
          {results.length === 0 ? (
            <div style={{ padding: "20px 14px", fontSize: 13, color: C.faint, textAlign: "center" }}>No matches.</div>
          ) : (
            results.map((r, i) => {
              const Icon = r.icon || FileText;
              const header = r.group !== lastGroup ? r.group : null;
              lastGroup = r.group;
              const active = i === sel;
              return (
                <React.Fragment key={r.id}>
                  {header && <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, letterSpacing: "0.09em", color: C.faint, padding: "9px 10px 5px" }}>{header.toUpperCase()}</div>}
                  <button
                    onMouseEnter={() => setSel(i)}
                    onClick={() => go(r)}
                    className="flex items-center"
                    style={{ width: "100%", textAlign: "left", gap: 11, padding: "9px 11px", borderRadius: 7, border: "none", background: active ? C.accentBg : "transparent", cursor: "pointer" }}
                  >
                    <Icon size={15} color={active ? C.accent : C.sub} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: active ? 600 : 500, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
                      {r.sub && <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.sub}</div>}
                    </div>
                    {active && <CornerDownLeft size={13} color={C.accent} />}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>
        <div className="flex items-center" style={{ gap: 14, padding: "8px 14px", borderTop: `1px solid ${C.line}`, background: C.panelAlt, color: C.faint, fontFamily: MONO, fontSize: 10 }}>
          <span className="inline-flex items-center" style={{ gap: 4 }}><ArrowUp size={11} /><ArrowDown size={11} /> navigate</span>
          <span className="inline-flex items-center" style={{ gap: 4 }}><CornerDownLeft size={11} /> open</span>
        </div>
      </div>
    </>
  );
}
