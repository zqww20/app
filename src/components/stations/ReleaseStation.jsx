import React from "react";
import { ShieldCheck, CheckCircle2, Radio, Info } from "lucide-react";
import { C, MONO } from "../../theme.js";
import { Panel, MonoLabel, Field, Callout, Blockers } from "../ui.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { availableTransitions } from "../../domain/stateMachine.js";
import { fmtDate } from "../../lib/format.js";

/* Release station: validate completeness against the chosen stream, then  */
/* the sign-off gate. Transmission runs through the CARM adapter and only   */
/* after a licensed broker commits — the system never auto-transmits.       */
export default function ReleaseStation({ shipment }) {
  const { ctxFor } = useStore();
  const ctx = ctxFor(shipment.id);
  const released = shipment.release?.transmitted;

  // surface the release-ready guard's blockers even before reaching the state
  const toRelease = availableTransitions({ shipment: { ...shipment, state: "pending_release_signoff" }, importer: ctx.importer })
    .find((t) => t.to === "released");
  const readiness = toRelease ? toRelease.blockers : [];

  const stream = shipment.release?.stream || "RMD";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel style={{ padding: "15px 18px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <MonoLabel>Release request</MonoLabel>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>STREAM · {stream}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>
          <Field label="Importer" value={ctx.importer?.legalName} />
          <Field label="Agency authority" value={ctx.importer?.agencyAuthority?.valid ? `Valid · exp ${fmtDate(ctx.importer.agencyAuthority.expiry)}` : "Not on file"} vColor={ctx.importer?.agencyAuthority?.valid ? C.good : C.alert} />
          <Field label="RPP security" value={ctx.importer?.rpp?.active ? `Active · exp ${fmtDate(ctx.importer.rpp.expiry)}` : "None on file"} vColor={ctx.importer?.rpp?.active ? C.good : C.alert} />
          <Field label="Lines" value={`${shipment.lines.length} · ${shipment.lines.filter((l) => l.classification && ["accepted", "edited"].includes(l.classification.status)).length} committed`} mono />
        </div>
      </Panel>

      {released ? (
        <Callout tone="good" icon={CheckCircle2} title="Released">
          <div>
            Release transmitted to CBSA.
            <span style={{ fontFamily: MONO, marginLeft: 8 }}>{shipment.release.cbsaRef}</span>
            {shipment.release.stub && <span style={{ color: C.faint }}> · stubbed acknowledgement</span>}
          </div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 5 }}>Transmitted {fmtDate(new Date(shipment.release.transmittedAt).toISOString().slice(0, 10))}. Next: begin accounting (CAD) within the CARM timeframe.</div>
        </Callout>
      ) : (
        <>
          {readiness.length > 0 ? (
            <Blockers blockers={readiness} title="Not release-ready" />
          ) : (
            <Callout tone="info" icon={Radio} title="Validated against the release stream">
              The release data set is complete for the {stream} stream.
            </Callout>
          )}

          <Callout tone="good" icon={ShieldCheck} title="Sign-off required to transmit">
            Use “Sign off & transmit release” in the actions bar above. Transmission runs through the CARM adapter and only after a licensed broker commits — the system never auto-transmits.
          </Callout>
        </>
      )}
    </div>
  );
}
