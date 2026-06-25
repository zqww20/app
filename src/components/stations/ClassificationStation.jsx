import React from "react";
import { BookMarked, Info } from "lucide-react";
import { C, MONO } from "../../theme.js";
import { Panel, MonoLabel, Stat, Callout, EmptyState } from "../ui.jsx";
import LineClassification from "../LineClassification.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { summarize } from "../../lib/shipment.js";

export default function ClassificationStation({ shipment }) {
  const { importerOf, precedents } = useStore();
  const importer = importerOf(shipment);
  const sum = summarize(shipment);
  const intakeDone = shipment.intake?.headerConfirmed && shipment.intake?.linesConfirmed;
  const impPrecedents = [
    ...precedents.filter((p) => p.importerId === shipment.importerId),
    ...(importer?.commodities || []).map((c) => ({ hs: c.hs, heading: c.heading, description: c.keyword, decidedByName: "settled", decidedAt: c.lastSettled })),
  ];

  if (!intakeDone) {
    return (
      <Callout tone="warn" icon={Info} title="Intake not confirmed">
        Classification opens once the clerk confirms the extracted header and line set at intake. Complete the intake checkpoint first.
      </Callout>
    );
  }

  if (sum.lineCount === 0) {
    return <EmptyState icon={Info} title="No line items">Add and confirm line items at intake before classifying.</EmptyState>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div className="flex" style={{ gap: 26, flexWrap: "wrap" }}>
          <Stat label="Lines" value={sum.lineCount} />
          <Stat label="Committed" value={sum.decided} color={sum.allDecided ? C.good : C.ink} />
          <Stat label="Need review" value={sum.lineCount - sum.decided} color={sum.lineCount - sum.decided ? C.warn : C.good} />
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint, maxWidth: 280, textAlign: "right" }}>
          Each accepted or edited code commits to this importer’s precedent library for consistency.
        </div>
      </Panel>

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {sum.lines.map((lv, i) => (
          <LineClassification key={lv.line.id} shipment={shipment} lv={lv} index={i} precedents={impPrecedents} />
        ))}
      </div>

      {impPrecedents.length > 0 && (
        <Panel style={{ padding: "13px 16px" }}>
          <div className="flex items-center" style={{ gap: 8, marginBottom: 9 }}>
            <BookMarked size={14} color={C.accent} />
            <MonoLabel>Precedent library · {importer?.legalName}</MonoLabel>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {impPrecedents.slice(0, 6).map((p, i) => (
              <div key={i} className="flex items-center justify-between" style={{ fontSize: 12, paddingBottom: 6, borderBottom: i < Math.min(impPrecedents.length, 6) - 1 ? `1px solid ${C.lineSoft}` : "none" }}>
                <span style={{ color: C.sub }}>{p.description}</span>
                <span style={{ fontFamily: MONO, color: C.ink }}>{p.hs}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
