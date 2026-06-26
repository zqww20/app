import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, AlertTriangle, Clock, Boxes, Stamp, FileWarning, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, Stat, MonoLabel, StateBadge, PageHeader, Tag } from "../components/ui.jsx";
import { useStore } from "../store/StoreContext.jsx";
import { useSession } from "../auth/SessionContext.jsx";
import { summarize } from "../lib/shipment.js";
import { money0, daysFromToday, relativeDay, timeAgo, fmtDate } from "../lib/format.js";

function StatCard({ icon: Icon, label, value, tone, to }) {
  const inner = (
    <Panel hover={!!to} style={{ padding: "14px 16px", cursor: to ? "pointer" : "default" }}>
      <Icon size={15} color={tone} style={{ marginBottom: 10 }} />
      <Stat label={label} value={value} color={tone} />
    </Panel>
  );
  return to ? <Link to={to} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

export default function Worklist({ onOpenAssistant }) {
  const { shipments, importers, audit, getImporter } = useStore();
  const { currentUser, hasSignoff, roleLabels } = useSession();

  const open = shipments.filter((s) => s.state !== "archived");
  const pendingSignoff = shipments.filter((s) => s.state === "pending_release_signoff");
  const inClass = shipments.filter((s) => s.state === "in_classification" || s.state === "in_intake");
  const corrections = shipments.filter((s) => s.state === "under_correction");

  // compliance watch — expiring authority / RPP, missing security
  const watch = [];
  for (const imp of importers) {
    const aDays = daysFromToday(imp.agencyAuthority?.expiry);
    if (imp.agencyAuthority?.valid && aDays != null && aDays <= 30)
      watch.push({ importer: imp, kind: aDays < 0 ? "expired" : "expiring", text: `Agency authority ${aDays < 0 ? "expired" : "expires"} ${relativeDay(imp.agencyAuthority.expiry)}` });
    if (!imp.rpp?.active) watch.push({ importer: imp, kind: "missing", text: "No active RPP financial security on file" });
    else {
      const rDays = daysFromToday(imp.rpp.expiry);
      if (rDays != null && rDays <= 30) watch.push({ importer: imp, kind: rDays < 0 ? "expired" : "expiring", text: `RPP security ${rDays < 0 ? "expired" : "expires"} ${relativeDay(imp.rpp.expiry)}` });
    }
    if (!imp.carm?.delegation) watch.push({ importer: imp, kind: "missing", text: "CARM delegation of authority not granted" });
  }

  // SIMA-flagged open files
  const simaFiles = open.map((s) => ({ s, sum: summarize(s) })).filter((x) => x.sum.sima.length > 0);

  // my queue
  const mine = open.filter((s) => s.assigned === currentUser?.id);

  return (
    <div>
      <PageHeader
        eyebrow={`SIGNED IN AS ${roleLabels.join(" · ").toUpperCase()}`}
        title="Worklist"
        sub="Exceptions first: files waiting on a broker, blocked work, and lapsing authorities. Nothing files without explicit sign-off."
        right={hasSignoff ? <Tag tone="good" icon={ShieldCheck}>Sign-off authority</Tag> : <Tag tone="neutral">View / prepare only</Tag>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard icon={Boxes} label="Open files" value={open.length} tone={C.ink} to="/shipments" />
        <StatCard icon={Stamp} label="Awaiting sign-off" value={pendingSignoff.length} tone={C.warn} to="/shipments" />
        <StatCard icon={Sparkles} label="In intake / classification" value={inClass.length} tone={C.accent} to="/shipments" />
        <StatCard icon={FileWarning} label="Under correction" value={corrections.length} tone={C.alert} to="/shipments" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* awaiting sign-off */}
          <section>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <MonoLabel>Awaiting a licensed broker · {pendingSignoff.length}</MonoLabel>
            </div>
            {pendingSignoff.length === 0 ? (
              <Panel style={{ padding: "16px", fontSize: 13, color: C.sub }}>Nothing is waiting on sign-off.</Panel>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {pendingSignoff.map((s) => {
                  const imp = getImporter(s.importerId);
                  const sum = summarize(s);
                  return (
                    <Link key={s.id} to={`/shipments/${s.id}`} style={{ textDecoration: "none" }}>
                      <Panel hover style={{ padding: "13px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer" }}>
                        <div>
                          <div className="flex items-center" style={{ gap: 9 }}>
                            <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600 }}>{s.no}</span>
                            <StateBadge state={s.state} size="sm" />
                          </div>
                          <div style={{ fontSize: 13, marginTop: 5, fontWeight: 500 }}>{imp?.legalName}</div>
                          <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub, marginTop: 3 }}>{s.supplier} · {s.originCountry}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600 }}>{money0(sum.value)}</div>
                          <div style={{ fontFamily: MONO, fontSize: 10.5, color: hasSignoff ? C.good : C.warn, marginTop: 4 }}>
                            {hasSignoff ? "you can sign off" : "needs broker"}
                          </div>
                        </div>
                      </Panel>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* SIMA exposure */}
          {simaFiles.length > 0 && (
            <section>
              <MonoLabel style={{ display: "block", marginBottom: 10 }}>SIMA exposure · {simaFiles.length}</MonoLabel>
              <Panel style={{ padding: "4px 0" }}>
                {simaFiles.map(({ s, sum }, i) => {
                  const imp = getImporter(s.importerId);
                  return (
                    <Link key={s.id} to={`/shipments/${s.id}`} style={{ textDecoration: "none" }}>
                      <div className="mf-tr flex" style={{ gap: 10, padding: "11px 15px", borderTop: i ? `1px solid ${C.lineSoft}` : "none", cursor: "pointer" }}>
                        <ShieldAlert size={14} color={C.alert} style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div className="flex items-center" style={{ gap: 7 }}>
                            <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600 }}>{s.no}</span>
                            <span style={{ fontSize: 11.5, color: C.faint }}>{imp?.legalName}</span>
                          </div>
                          <div style={{ fontSize: 12, color: C.sub, marginTop: 3, lineHeight: 1.45 }}>
                            {sum.sima[0].measure.product} from {sum.sima[0].line.origin} — screen exporter against the active measure before staging.
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </Panel>
            </section>
          )}

          {/* my queue */}
          <section>
            <MonoLabel style={{ display: "block", marginBottom: 10 }}>Assigned to you · {mine.length}</MonoLabel>
            {mine.length === 0 ? (
              <Panel style={{ padding: "16px", fontSize: 13, color: C.sub }}>No files are currently assigned to you.</Panel>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {mine.map((s) => {
                  const imp = getImporter(s.importerId);
                  return (
                    <Link key={s.id} to={`/shipments/${s.id}`} style={{ textDecoration: "none" }}>
                      <Panel hover style={{ padding: "11px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer" }}>
                        <div className="flex items-center" style={{ gap: 10 }}>
                          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600 }}>{s.no}</span>
                          <span style={{ fontSize: 12.5, color: C.sub }}>{imp?.legalName}</span>
                        </div>
                        <div className="flex items-center" style={{ gap: 12 }}>
                          <span className="flex items-center" style={{ gap: 4, fontFamily: MONO, fontSize: 10.5, color: C.faint }}><Clock size={11} /> ETA {relativeDay(s.etaDate)}</span>
                          <StateBadge state={s.state} size="sm" />
                        </div>
                      </Panel>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section>
            <MonoLabel style={{ display: "block", marginBottom: 10 }}>Compliance watch · {watch.length}</MonoLabel>
            <Panel style={{ padding: "4px 0" }}>
              {watch.length === 0 ? (
                <div style={{ padding: "12px 15px", fontSize: 12.5, color: C.sub }}>No lapsing authorities or security.</div>
              ) : (
                watch.map((w, i) => (
                  <Link key={i} to={`/importers/${w.importer.id}`} style={{ textDecoration: "none" }}>
                    <div className="mf-tr flex" style={{ gap: 9, padding: "10px 15px", borderTop: i ? `1px solid ${C.lineSoft}` : "none", cursor: "pointer" }}>
                      <AlertTriangle size={13} color={w.kind === "missing" || w.kind === "expired" ? C.alert : C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 500 }}>{w.importer.legalName}</div>
                        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{w.text}</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </Panel>
          </section>

          <section>
            <MonoLabel style={{ display: "block", marginBottom: 10 }}>Recent activity</MonoLabel>
            <Panel style={{ padding: "4px 0" }}>
              {audit.slice(0, 7).map((a, i) => (
                <div key={a.id} className="flex" style={{ gap: 9, padding: "9px 15px", borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
                  {a.signoff && <ShieldCheck size={12} color={C.good} style={{ flexShrink: 0, marginTop: 2 }} />}
                  <div>
                    <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.45 }}>
                      <span style={{ color: C.ink, fontWeight: 500 }}>{a.actorName}</span> — {a.reason}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, marginTop: 2 }}>{timeAgo(a.ts)} · {a.action}</div>
                  </div>
                </div>
              ))}
            </Panel>
            <Link to="/audit" style={{ textDecoration: "none" }}>
              <div className="flex items-center" style={{ gap: 5, marginTop: 9, color: C.sub, fontFamily: MONO, fontSize: 11 }}>
                Full audit log <ArrowRight size={12} />
              </div>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
