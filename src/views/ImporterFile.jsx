import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, BookMarked, ChevronRight, Building2, StickyNote } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, Stat, MonoLabel, StateBadge, PageHeader, Field, Callout, EmptyState } from "../components/ui.jsx";
import { useStore } from "../store/StoreContext.jsx";
import { daysFromToday, relativeDay, fmtDate, money0, initials } from "../lib/format.js";

function CheckpointRow({ ok, label, detail, warn }) {
  const tone = ok ? C.good : warn ? C.warn : C.alert;
  return (
    <div className="flex items-start" style={{ gap: 10, padding: "11px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
      {ok ? <CheckCircle2 size={15} color={tone} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertTriangle size={15} color={tone} style={{ flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{label}</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: tone, marginTop: 2 }}>{detail}</div>
      </div>
    </div>
  );
}

export default function ImporterFile() {
  const { id } = useParams();
  const { getImporter, shipments, precedents } = useStore();
  const imp = getImporter(id);

  if (!imp) {
    return <EmptyState icon={Building2} title={`No importer ${id}`}><Link to="/importers" style={{ color: C.accent }}>Back to importers</Link>.</EmptyState>;
  }

  const aDays = daysFromToday(imp.agencyAuthority?.expiry);
  const rDays = daysFromToday(imp.rpp?.expiry);
  const agencyOk = imp.agencyAuthority?.valid && (aDays == null || aDays >= 0);
  const rppOk = imp.rpp?.active && (rDays == null || rDays >= 0);
  const releaseReady = agencyOk && rppOk && imp.carm?.delegation;

  const files = shipments.filter((s) => s.importerId === id);
  const impPrecedents = [
    ...precedents.filter((p) => p.importerId === id),
    ...(imp.commodities || []).map((c) => ({ hs: c.hs, heading: c.heading, description: c.keyword, decidedByName: "settled", decidedAt: c.lastSettled })),
  ];

  return (
    <div>
      <Link to="/importers" className="flex items-center" style={{ gap: 6, color: C.sub, fontFamily: MONO, fontSize: 11.5, marginBottom: 13, textDecoration: "none", width: "fit-content" }}>
        <ArrowLeft size={13} /> All importers
      </Link>

      <div className="flex items-start" style={{ gap: 14, marginBottom: 20 }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, background: C.accentBg, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 15, fontWeight: 600, flexShrink: 0 }}>{initials(imp.legalName)}</div>
        <div style={{ flex: 1 }}>
          <div className="flex items-center" style={{ gap: 11, flexWrap: "wrap" }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>{imp.legalName}</span>
            {releaseReady ? (
              <span className="inline-flex items-center" style={{ gap: 6, background: C.goodBg, border: `1px solid ${C.goodLine}`, color: C.good, borderRadius: 999, padding: "4px 10px", fontFamily: MONO, fontSize: 10.5, fontWeight: 600 }}><ShieldCheck size={12} /> RELEASE-READY</span>
            ) : (
              <span className="inline-flex items-center" style={{ gap: 6, background: C.alertBg, border: `1px solid ${C.alertLine}`, color: C.alert, borderRadius: 999, padding: "4px 10px", fontFamily: MONO, fontSize: 10.5, fontWeight: 600 }}><AlertTriangle size={12} /> NOT RELEASE-READY</span>
            )}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.faint, marginTop: 5 }}>BN {imp.businessNumber} {imp.programAccount} · {imp.ior}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start", marginBottom: 16 }}>
        {/* checkpoints */}
        <Panel style={{ padding: "15px 18px" }}>
          <MonoLabel style={{ display: "block", marginBottom: 6 }}>Release-readiness checkpoints</MonoLabel>
          <CheckpointRow ok={agencyOk} warn={agencyOk && aDays != null && aDays <= 30} label="Agency agreement / power of attorney" detail={imp.agencyAuthority?.valid ? `${imp.agencyAuthority.type} · ${aDays != null && aDays < 0 ? "expired" : "valid to"} ${fmtDate(imp.agencyAuthority.expiry)} (${relativeDay(imp.agencyAuthority.expiry)})` : "Not on file"} />
          <CheckpointRow ok={rppOk} warn={rppOk && rDays != null && rDays <= 30} label="RPP financial security (importer’s own)" detail={imp.rpp?.active ? `${imp.rpp.type} · ${money0(imp.rpp.amount)} · to ${fmtDate(imp.rpp.expiry)} (${relativeDay(imp.rpp.expiry)})` : "No active security — blocks release"} />
          <CheckpointRow ok={imp.carm?.registered} label="CARM Client Portal registration" detail={imp.carm?.registered ? "Registered" : "Not registered"} />
          <div className="flex items-start" style={{ gap: 10, padding: "11px 0 0" }}>
            {imp.carm?.delegation ? <CheckCircle2 size={15} color={C.good} style={{ marginTop: 1 }} /> : <AlertTriangle size={15} color={C.alert} style={{ marginTop: 1 }} />}
            <div>
              <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>CARM delegation of authority</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: imp.carm?.delegation ? C.good : C.alert, marginTop: 2 }}>{imp.carm?.delegation ? "Delegated to broker" : "Not delegated — blocks release"}</div>
            </div>
          </div>
        </Panel>

        {/* registration details */}
        <Panel style={{ padding: "15px 18px" }}>
          <MonoLabel style={{ display: "block", marginBottom: 12 }}>Registration</MonoLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Business number" value={`${imp.businessNumber} ${imp.programAccount}`} mono />
            <Field label="GST/HST" value={imp.gstHst} mono />
            <Field label="Default treatments" value={(imp.defaultTreatments || []).join(", ") || "—"} mono />
            <Field label="Trade names" value={imp.tradeNames?.length ? imp.tradeNames.join(", ") : "—"} />
          </div>
          {imp.note && (
            <div style={{ marginTop: 14 }}>
              <Callout tone="info" icon={StickyNote} title="Standing instruction">{imp.note}</Callout>
            </div>
          )}
        </Panel>
      </div>

      {/* precedents */}
      {impPrecedents.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}><BookMarked size={14} color={C.accent} /><MonoLabel>Classification precedent library · {impPrecedents.length}</MonoLabel></div>
          <Panel style={{ padding: "6px 16px" }}>
            {impPrecedents.map((p, i) => (
              <div key={i} className="flex items-center justify-between" style={{ padding: "9px 0", borderBottom: i < impPrecedents.length - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                <span style={{ fontSize: 12.5, color: C.ink }}>{p.description}</span>
                <div className="flex items-center" style={{ gap: 12 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: C.ink }}>{p.hs}</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{p.decidedAt ? fmtDate(typeof p.decidedAt === "number" ? new Date(p.decidedAt).toISOString().slice(0, 10) : p.decidedAt) : ""}</span>
                </div>
              </div>
            ))}
          </Panel>
        </div>
      )}

      {/* files */}
      <MonoLabel style={{ display: "block", marginBottom: 10 }}>Shipment files · {files.length}</MonoLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {files.map((s) => (
          <Link key={s.id} to={`/shipments/${s.id}`} style={{ textDecoration: "none" }}>
            <Panel hover style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ width: 130, flexShrink: 0 }}>
                <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600 }}>{s.no}</div>
                <div style={{ fontSize: 11.5, color: C.sub, marginTop: 3 }}>{relativeDay(s.etaDate)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.supplier}</div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint, marginTop: 3 }}>{s.originCountry} → {s.port}</div>
              </div>
              <StateBadge state={s.state} size="sm" />
              <ChevronRight size={16} color={C.faint} style={{ flexShrink: 0 }} />
            </Panel>
          </Link>
        ))}
        {files.length === 0 && <Panel style={{ padding: 24, textAlign: "center", color: C.sub, fontSize: 13 }}>No shipment files for this importer.</Panel>}
      </div>
    </div>
  );
}
