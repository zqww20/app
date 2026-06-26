import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { C, MONO, toneOf } from "../theme.js";
import { PageHeader, MonoLabel } from "../components/ui.jsx";
import { OwnerChip, DeadlinePill } from "../components/workflowUi.jsx";
import { useStore } from "../store/StoreContext.jsx";
import { STAGES, stateOf } from "../domain/constants.js";
import { nextAction, urgency, priority } from "../lib/workflow.js";
import { summarize } from "../lib/shipment.js";
import { money0 } from "../lib/format.js";

/* Columns that carry live work. Archive is the resting place, shown last  */
/* and dimmed. */
const COLUMNS = STAGES.filter((s) => s.id !== "archive");

export default function Pipeline() {
  const { shipments, getImporter } = useStore();
  const navigate = useNavigate();

  const byStage = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.id, []]));
    for (const s of shipments) {
      if (s.state === "archived") continue;
      const stage = stateOf(s.state).stage;
      if (!map[stage]) continue;
      const importer = getImporter(s.importerId);
      const action = nextAction(s, importer);
      const urg = urgency(s);
      map[stage].push({ s, importer, action, urg, sum: summarize(s), prio: priority(s, action, urg) });
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.prio - b.prio);
    return map;
  }, [shipments, getImporter]);

  return (
    <div>
      <PageHeader
        eyebrow="OPERATIONS"
        title="Pipeline"
        sub="Every active file by lifecycle stage. Watch the flow, spot where work is piling up, and click any card to work it."
      />

      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
        {COLUMNS.map((col) => {
          const cards = byStage[col.id] || [];
          return (
            <div key={col.id} style={{ width: 252, flexShrink: 0, display: "flex", flexDirection: "column" }}>
              <div className="flex items-center justify-between" style={{ padding: "0 4px 9px" }}>
                <MonoLabel>{col.label}</MonoLabel>
                <span className="tnum" style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: cards.length ? C.ink : C.faint, background: C.mutedBg, borderRadius: 999, padding: "1px 8px" }}>{cards.length}</span>
              </div>
              <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 9, minHeight: 120, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {cards.length === 0 ? (
                  <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center", padding: "18px 8px" }}>—</div>
                ) : (
                  cards.map(({ s, importer, action, urg, sum }) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/shipments/${s.id}`)}
                      className="mf-hover"
                      style={{ textAlign: "left", background: C.panel, border: `1px solid ${action.blocked ? C.alertLine : C.line}`, borderRadius: 8, padding: "11px 12px", cursor: "pointer", boxShadow: "0 1px 2px rgba(20,28,38,0.04)" }}
                    >
                      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                        <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: C.ink }}>{s.no}</span>
                        <DeadlinePill urgency={urg} size="sm" />
                      </div>
                      <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 500, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{importer?.legalName}</div>
                      <div className="flex items-center" style={{ gap: 7, marginTop: 8, marginBottom: 8 }}>
                        {action.blocked && <ShieldAlert size={12} color={C.alert} style={{ flexShrink: 0 }} />}
                        <span style={{ fontSize: 12, color: action.blocked ? C.alert : C.sub, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{action.short || action.label}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <OwnerChip owner={action.owner} size="sm" />
                        <span className="tnum" style={{ fontFamily: MONO, fontSize: 11, color: C.sub }}>{sum.value > 0 ? money0(sum.value) : ""}</span>
                      </div>
                      {(sum.sima.length > 0 || sum.ogd.length > 0) && (
                        <div className="flex items-center" style={{ gap: 5, marginTop: 8 }}>
                          {sum.sima.length > 0 && <span className="inline-flex items-center" style={{ gap: 3, color: C.alert, fontFamily: MONO, fontSize: 9, fontWeight: 600 }}><ShieldAlert size={9} /> SIMA</span>}
                          {sum.ogd.length > 0 && <span className="inline-flex items-center" style={{ gap: 3, color: C.warn, fontFamily: MONO, fontSize: 9, fontWeight: 600 }}><AlertTriangle size={9} /> OGD</span>}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
