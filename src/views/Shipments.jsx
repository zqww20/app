import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Truck, Plane, Ship, ChevronRight, Plus, X } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, MonoLabel, StateBadge, PageHeader, Button } from "../components/ui.jsx";
import { useStore } from "../store/StoreContext.jsx";
import { useSession } from "../auth/SessionContext.jsx";
import { summarize } from "../lib/shipment.js";
import { money0, relativeDay } from "../lib/format.js";
import { STAGES } from "../domain/constants.js";

const MODE_ICON = { Truck, Air: Plane, Ocean: Ship };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_intake", label: "Intake" },
  { key: "in_classification", label: "Classification" },
  { key: "pending_release_signoff", label: "Awaiting sign-off" },
  { key: "released", label: "Released" },
  { key: "accounted", label: "Accounted" },
  { key: "archived", label: "Archived" },
];

function NewShipmentModal({ onClose }) {
  const { importers, createShipment } = useStore();
  const { currentUser } = useSession();
  const navigate = useNavigate();
  const [f, setF] = useState({ importerId: importers[0]?.id || "", supplier: "", originCountry: "United States", mode: "Truck", port: "", incoterm: "", etaDate: "" });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const valid = f.importerId && f.supplier.trim();

  function submit() {
    if (!valid) return;
    const id = createShipment({ ...f, assigned: currentUser?.id });
    onClose();
    navigate(`/shipments/${id}`);
  }

  const inputStyle = { width: "100%", fontFamily: "inherit", fontSize: 13, padding: "8px 10px", border: `1px solid ${C.line}`, borderRadius: 6, outline: "none", color: C.ink, background: C.panel };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,35,48,0.3)", zIndex: 50 }} />
      <div className="mf-fade" style={{ position: "fixed", top: "10vh", left: "50%", transform: "translateX(-50%)", width: 520, maxWidth: "94vw", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 11, boxShadow: "0 24px 60px rgba(26,35,48,0.2)", zIndex: 51, overflow: "hidden" }}>
        <div className="flex items-center justify-between" style={{ padding: "15px 18px", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Open a shipment file</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={C.sub} /></button>
        </div>
        <div style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <MonoLabel>Importer of record</MonoLabel>
            <select value={f.importerId} onChange={set("importerId")} style={{ ...inputStyle, marginTop: 5 }}>
              {importers.map((i) => <option key={i.id} value={i.id}>{i.legalName}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <MonoLabel>Supplier / exporter</MonoLabel>
            <input value={f.supplier} onChange={set("supplier")} placeholder="e.g. Permian Fluid Power Inc." style={{ ...inputStyle, marginTop: 5 }} />
          </div>
          <div>
            <MonoLabel>Country of origin</MonoLabel>
            <input value={f.originCountry} onChange={set("originCountry")} style={{ ...inputStyle, marginTop: 5 }} />
          </div>
          <div>
            <MonoLabel>Mode</MonoLabel>
            <select value={f.mode} onChange={set("mode")} style={{ ...inputStyle, marginTop: 5 }}>
              <option>Truck</option><option>Air</option><option>Ocean</option><option>Rail</option>
            </select>
          </div>
          <div>
            <MonoLabel>Port of entry</MonoLabel>
            <input value={f.port} onChange={set("port")} placeholder="e.g. Coutts, AB (705)" style={{ ...inputStyle, marginTop: 5 }} />
          </div>
          <div>
            <MonoLabel>Incoterm</MonoLabel>
            <input value={f.incoterm} onChange={set("incoterm")} placeholder="e.g. FCA Houston" style={{ ...inputStyle, marginTop: 5 }} />
          </div>
          <div>
            <MonoLabel>ETA</MonoLabel>
            <input type="date" value={f.etaDate} onChange={set("etaDate")} style={{ ...inputStyle, marginTop: 5 }} />
          </div>
        </div>
        <div className="flex items-center justify-between" style={{ padding: "13px 18px", borderTop: `1px solid ${C.line}`, background: C.panelAlt }}>
          <span style={{ fontSize: 11.5, color: C.faint }}>Opens in “awaiting documents”. Add the invoice to start extraction.</span>
          <div className="flex items-center" style={{ gap: 9 }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" icon={Plus} disabled={!valid} onClick={submit}>Open file</Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Shipments() {
  const { shipments, getImporter } = useStore();
  const [params, setParams] = useSearchParams();
  const filter = params.get("state") || "all";
  const [creating, setCreating] = useState(false);

  const rows = shipments.filter((s) => {
    if (filter === "all") return true;
    if (filter === "open") return s.state !== "archived";
    return s.state === filter;
  });

  return (
    <div>
      <PageHeader
        eyebrow="OPERATIONS"
        title="Shipments"
        sub="Every shipment file in the pipeline. Each row is one commercial transaction moving through the lifecycle."
        right={<Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>New shipment</Button>}
      />

      <div className="flex items-center" style={{ gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map((ff) => {
          const count = ff.key === "all" ? shipments.length : ff.key === "open" ? shipments.filter((s) => s.state !== "archived").length : shipments.filter((s) => s.state === ff.key).length;
          const active = filter === ff.key;
          return (
            <button key={ff.key} onClick={() => setParams(ff.key === "all" ? {} : { state: ff.key })} className="flex items-center" style={{ gap: 7, fontFamily: MONO, fontSize: 11.5, color: active ? "#fff" : C.sub, background: active ? C.ink : C.panel, border: `1px solid ${active ? C.ink : C.line}`, borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>
              {ff.label}<span style={{ opacity: 0.7, fontSize: 10.5 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center" style={{ padding: "0 16px 9px", gap: 12 }}>
        <Head w={170}>File · Importer</Head>
        <Head flex>Supplier · Route</Head>
        <Head w={96} right>Value (CAD)</Head>
        <Head w={104} right>Lines</Head>
        <Head w={150}>State</Head>
        <Head w={66} right>ETA</Head>
        <div style={{ width: 16 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((s, i) => {
          const imp = getImporter(s.importerId);
          const sum = summarize(s);
          const I = MODE_ICON[s.mode] || Truck;
          return (
            <Link key={s.id} to={`/shipments/${s.id}`} style={{ textDecoration: "none" }}>
              <Panel hover className="mf-row" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", animationDelay: `${i * 35}ms` }}>
                <div style={{ width: 170, flexShrink: 0 }}>
                  <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600 }}>{s.no}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{imp?.legalName}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.supplier || "—"}</div>
                  <div className="flex items-center" style={{ gap: 7, marginTop: 3, color: C.faint, fontFamily: MONO, fontSize: 10.5 }}>
                    <I size={12} /><span>{s.originCountry}</span><span style={{ color: C.line }}>→</span><span>{s.port || "—"}</span>
                  </div>
                </div>
                <div style={{ width: 96, textAlign: "right", flexShrink: 0, fontFamily: MONO, fontSize: 13, fontWeight: 600 }}>{sum.value > 0 ? money0(sum.value) : "—"}</div>
                <div style={{ width: 104, textAlign: "right", flexShrink: 0, fontFamily: MONO, fontSize: 11.5 }}>
                  {sum.lineCount === 0 ? <span style={{ color: C.faint }}>none</span> : (
                    <>
                      <span style={{ color: C.ink }}>{sum.decided}/{sum.lineCount}</span>
                      <span style={{ color: sum.allDecided ? C.good : C.warn, marginLeft: 6 }}>{sum.allDecided ? "set" : "open"}</span>
                    </>
                  )}
                </div>
                <div style={{ width: 150, flexShrink: 0 }}><StateBadge state={s.state} size="sm" /></div>
                <div style={{ width: 66, textAlign: "right", flexShrink: 0, fontFamily: MONO, fontSize: 11, color: C.sub }}>{relativeDay(s.etaDate)}</div>
                <ChevronRight size={16} color={C.faint} style={{ flexShrink: 0 }} />
              </Panel>
            </Link>
          );
        })}
        {rows.length === 0 && <Panel style={{ padding: 30, textAlign: "center", color: C.sub, fontSize: 13 }}>No shipments in this state.</Panel>}
      </div>

      {creating && <NewShipmentModal onClose={() => setCreating(false)} />}
    </div>
  );
}

function Head({ children, w, flex, right }) {
  return <div style={{ width: flex ? undefined : w, flex: flex ? 1 : undefined, textAlign: right ? "right" : "left", flexShrink: 0 }}><MonoLabel>{children}</MonoLabel></div>;
}
