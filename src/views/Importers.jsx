import React from "react";
import { Link } from "react-router-dom";
import { Building2, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, Stat, MonoLabel, PageHeader, Tag } from "../components/ui.jsx";
import { useStore } from "../store/StoreContext.jsx";
import { daysFromToday, relativeDay, initials } from "../lib/format.js";

function readiness(imp) {
  const issues = [];
  if (!imp.agencyAuthority?.valid) issues.push("No agency authority");
  else if ((daysFromToday(imp.agencyAuthority.expiry) ?? 99) <= 30) issues.push("Agency authority expiring");
  if (!imp.rpp?.active) issues.push("No RPP security");
  else if ((daysFromToday(imp.rpp.expiry) ?? 99) <= 30) issues.push("RPP security expiring");
  if (!imp.carm?.delegation) issues.push("No CARM delegation");
  return issues;
}

export default function Importers() {
  const { importers, shipments } = useStore();

  return (
    <div>
      <PageHeader
        eyebrow="ACCOUNTS"
        title="Importers"
        sub="The master record for each importer of record. Release readiness depends on valid agency authority and active RPP financial security."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 13 }}>
        {importers.map((imp, i) => {
          const issues = readiness(imp);
          const ready = issues.length === 0;
          const open = shipments.filter((s) => s.importerId === imp.id && s.state !== "archived").length;
          return (
            <Link key={imp.id} to={`/importers/${imp.id}`} style={{ textDecoration: "none" }}>
              <Panel className="mf-row" style={{ padding: "16px 17px", cursor: "pointer", animationDelay: `${i * 45}ms`, height: "100%" }}>
                <div className="flex items-start justify-between" style={{ marginBottom: 13 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: C.accentBg, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 12, fontWeight: 600 }}>
                    {initials(imp.legalName)}
                  </div>
                  {ready ? <Tag tone="good" icon={ShieldCheck}>Release-ready</Tag> : <Tag tone="alert" icon={AlertTriangle}>{issues.length} issue{issues.length === 1 ? "" : "s"}</Tag>}
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{imp.legalName}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.faint, marginTop: 4 }}>BN {imp.businessNumber} {imp.programAccount}</div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.lineSoft}`, display: "flex", flexDirection: "column", gap: 6 }}>
                  {ready ? (
                    <div className="flex items-center" style={{ gap: 7, fontSize: 12, color: C.good }}>
                      <CheckCircle2 size={13} /> Authority & security current
                    </div>
                  ) : (
                    issues.map((iss) => (
                      <div key={iss} className="flex items-center" style={{ gap: 7, fontSize: 12, color: C.alert }}>
                        <AlertTriangle size={12} /> {iss}
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center" style={{ gap: 22, marginTop: 13 }}>
                  <Stat label="Open files" value={open} color={open ? C.ink : C.sub} />
                  <Stat label="Commodities settled" value={imp.commodities?.length || 0} />
                </div>
              </Panel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
