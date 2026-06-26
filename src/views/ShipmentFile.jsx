import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Truck, Plane, Ship, Sparkles, ScrollText, Building2, FileText, ArrowDown, CheckCircle2 } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, Stat, MonoLabel, StateBadge, Meta, EmptyState, Button } from "../components/ui.jsx";
import { OwnerChip, DeadlinePill, AssignControl } from "../components/workflowUi.jsx";
import StageRail from "../components/StageRail.jsx";
import TransitionBar from "../components/TransitionBar.jsx";
import AuditTrail from "../components/AuditTrail.jsx";
import IntakeStation from "../components/stations/IntakeStation.jsx";
import ClassificationStation from "../components/stations/ClassificationStation.jsx";
import AssessmentStation from "../components/stations/AssessmentStation.jsx";
import ReleaseStation from "../components/stations/ReleaseStation.jsx";
import { ValuationStation, AccountingStation, BillingStation, PostEntryStation } from "../components/stations/SimpleStations.jsx";
import { useStore } from "../store/StoreContext.jsx";
import { useSession } from "../auth/SessionContext.jsx";
import { stateOf, STAGE_LABEL } from "../domain/constants.js";
import { summarize } from "../lib/shipment.js";
import { nextAction, urgency, actionableByMe } from "../lib/workflow.js";
import { money, money0, relativeDay, fmtDate } from "../lib/format.js";

const MODE_ICON = { Truck, Air: Plane, Ocean: Ship };

const STATION = {
  intake: IntakeStation,
  classification: ClassificationStation,
  valuation: ValuationStation,
  assessment: AssessmentStation,
  release: ReleaseStation,
  accounting: AccountingStation,
  billing: BillingStation,
  post_entry: PostEntryStation,
};

export default function ShipmentFile({ onOpenAssistant }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getShipment, importerOf } = useStore();
  const session = useSession();
  const shipment = getShipment(id);
  const currentStage = shipment ? stateOf(shipment.state).stage : "intake";
  const [activeStage, setActiveStage] = useState(currentStage);

  useEffect(() => { setActiveStage(currentStage); }, [currentStage]);

  if (!shipment) {
    return (
      <EmptyState icon={FileText} title={`No shipment ${id}`}>
        It may have been archived. <Link to="/shipments" style={{ color: C.accent }}>Back to shipments</Link>.
      </EmptyState>
    );
  }

  const importer = importerOf(shipment);
  const sum = summarize(shipment);
  const action = nextAction(shipment, importer);
  const urg = urgency(shipment);
  const mine = actionableByMe(action, { roles: session.currentUser?.roles, hasSignoff: session.hasSignoff });
  const I = MODE_ICON[shipment.mode] || Truck;
  const Station = STATION[activeStage] || (() => <EmptyState icon={ScrollText} title="Archived">This file is archived. Its record and audit trail are retained.</EmptyState>);
  const isArchived = shipment.state === "archived";

  function workIt() {
    if (action.cta?.kind === "station" && action.cta.stage) setActiveStage(action.cta.stage);
    const el = document.getElementById("station");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6, background: "none", border: "none", cursor: "pointer", color: C.sub, fontFamily: MONO, fontSize: 11.5, marginBottom: 13, padding: 0 }}>
        <ArrowLeft size={13} /> Back
      </button>

      {/* header */}
      <div className="flex items-start justify-between" style={{ gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <div className="flex items-center" style={{ gap: 11 }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.018em" }}>{shipment.no}</span>
            <StateBadge state={shipment.state} />
          </div>
          <Link to={`/importers/${importer?.id}`} className="flex items-center" style={{ gap: 6, marginTop: 6, color: C.sub, textDecoration: "none", width: "fit-content" }}>
            <Building2 size={13} /><span style={{ fontSize: 13 }}>{importer?.legalName}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.faint }}>· {shipment.supplier}</span>
          </Link>
        </div>
        <div className="flex items-center" style={{ gap: 9 }}>
          <AssignControl shipment={shipment} />
          <Button variant="default" icon={Sparkles} onClick={onOpenAssistant}>Ask about this file</Button>
        </div>
      </div>

      {/* NEXT ACTION hero */}
      {!isArchived && (
        <Panel elevated style={{ padding: 0, overflow: "hidden", marginBottom: 16, borderColor: action.blocked ? C.alertLine : mine ? C.accentLine : C.line }}>
          <div style={{ padding: "15px 18px", background: action.blocked ? "linear-gradient(180deg,#FCF1F0,#fff)" : mine ? "linear-gradient(180deg,#EEF4FA,#fff)" : C.panel }}>
            <div className="flex items-center justify-between" style={{ gap: 12, flexWrap: "wrap" }}>
              <div>
                <div className="flex items-center" style={{ gap: 9 }}>
                  <MonoLabel color={action.blocked ? C.alert : C.accent}>Next action</MonoLabel>
                  {mine && <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.accent, background: "#fff", border: `1px solid ${C.accentLine}`, borderRadius: 4, padding: "1px 6px" }}>YOU</span>}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: action.blocked ? C.alert : C.ink, marginTop: 7, letterSpacing: "-0.01em" }}>{action.label}</div>
                <div className="flex items-center" style={{ gap: 12, marginTop: 9, flexWrap: "wrap" }}>
                  <OwnerChip owner={action.owner} />
                  <DeadlinePill urgency={urg} />
                </div>
              </div>
              {action.cta?.kind === "station" && (
                <Button variant="primary" icon={ArrowDown} onClick={workIt} style={{ fontSize: 13 }}>Work it</Button>
              )}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.line}`, padding: "13px 18px", background: C.panelAlt }}>
            <TransitionBar shipment={shipment} />
          </div>
        </Panel>
      )}

      {/* meta strip */}
      <Panel style={{ padding: "12px 17px", marginBottom: 16 }}>
        <div className="flex items-center" style={{ gap: 22, flexWrap: "wrap" }}>
          <Meta k="Mode" v={<span className="inline-flex items-center" style={{ gap: 5 }}><I size={12} color={C.sub} /> {shipment.mode}</span>} />
          <Meta k="Origin" v={shipment.originCountry || "—"} />
          <Meta k="Port" v={shipment.port || "—"} />
          <Meta k="Incoterm" v={shipment.incoterm || "—"} />
          <Meta k="ETA" v={shipment.etaDate ? `${fmtDate(shipment.etaDate)} (${relativeDay(shipment.etaDate)})` : "—"} />
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 322px", gap: 18, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: 16 }}>
            <StageRail state={shipment.state} activeStage={activeStage} onPick={setActiveStage} />
          </div>
          <div id="station" style={{ scrollMarginTop: 70 }}>
            <Station shipment={shipment} />
          </div>
        </div>

        {/* right rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 72 }}>
          <Panel style={{ padding: "15px 17px" }}>
            <MonoLabel style={{ display: "block", marginBottom: 12 }}>File summary</MonoLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Stat label="Customs value" value={sum.value > 0 ? money0(sum.value) : "—"} />
              <Stat label="Est. duty" value={sum.duty > 0 ? money(sum.duty) : "Free"} />
              <Stat label="Lines committed" value={`${sum.decided}/${sum.lineCount}`} color={sum.allDecided ? C.good : C.ink} />
              <Stat label="Flags" value={sum.sima.length + sum.ogd.length} color={sum.sima.length ? C.alert : sum.ogd.length ? C.warn : C.sub} />
            </div>
            <div style={{ marginTop: 13, paddingTop: 12, borderTop: `1px solid ${C.lineSoft}`, display: "grid", gap: 9 }}>
              <Meta k="Documents" v={`${shipment.documents.length} retained`} />
              <Meta k="Stage" v={STAGE_LABEL[currentStage]} />
            </div>
          </Panel>

          <Panel style={{ padding: "15px 17px" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 13 }}>
              <MonoLabel>Audit trail</MonoLabel>
              <Link to="/audit" style={{ textDecoration: "none", fontFamily: MONO, fontSize: 10, color: C.faint }}>ALL →</Link>
            </div>
            <AuditTrail shipmentId={shipment.id} limit={8} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
