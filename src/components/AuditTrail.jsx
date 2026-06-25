import React from "react";
import { ShieldCheck, GitCommitHorizontal } from "lucide-react";
import { C, MONO } from "../theme.js";
import { useStore } from "../store/StoreContext.jsx";
import { timeAgo } from "../lib/format.js";

/* Append-only history for one shipment (and its lines). Reconstructs any  */
/* decision after the fact: who, what, when, prior → new, and why.         */
export default function AuditTrail({ shipmentId, limit }) {
  const { audit } = useStore();
  let events = audit.filter((e) => e.entityId === shipmentId || (typeof e.entityId === "string" && e.entityId.startsWith(shipmentId + "/")));
  if (limit) events = events.slice(0, limit);

  if (!events.length) return <div style={{ fontSize: 12.5, color: C.sub, padding: "4px 2px" }}>No recorded actions yet.</div>;

  return (
    <div style={{ position: "relative" }}>
      {events.map((e, i) => (
        <div key={e.id} className="flex" style={{ gap: 11, paddingBottom: i === events.length - 1 ? 0 : 14 }}>
          <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: e.signoff ? C.goodBg : C.mutedBg, border: `1px solid ${e.signoff ? C.goodLine : C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {e.signoff ? <ShieldCheck size={12} color={C.good} /> : <GitCommitHorizontal size={12} color={C.sub} />}
            </div>
            {i < events.length - 1 && <div style={{ width: 1, flex: 1, background: C.line, marginTop: 2 }} />}
          </div>
          <div style={{ paddingBottom: 2 }}>
            <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.ink, fontWeight: 600 }}>{e.action}</span>
              {e.override && <span style={{ fontFamily: MONO, fontSize: 9, color: C.alert, background: C.alertBg, border: `1px solid ${C.alertLine}`, borderRadius: 4, padding: "1px 5px" }}>OVERRIDE</span>}
              {e.signoff && <span style={{ fontFamily: MONO, fontSize: 9, color: C.good, background: C.goodBg, border: `1px solid ${C.goodLine}`, borderRadius: 4, padding: "1px 5px" }}>SIGN-OFF</span>}
            </div>
            {(e.prior != null || e.next != null) && (
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub, marginTop: 3 }}>
                {e.field}: <span style={{ color: C.faint }}>{e.prior ?? "—"}</span> → <span style={{ color: C.ink }}>{e.next ?? "—"}</span>
                {e.ack ? `  ·  ${e.ack}` : ""}
              </div>
            )}
            {e.reason && <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.45 }}>{e.reason}</div>}
            <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, marginTop: 4 }}>{e.actorName} · {timeAgo(e.ts)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
