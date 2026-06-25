import React, { useState } from "react";
import { ArrowRight, Lock, ShieldCheck, RotateCcw, AlertTriangle, Check, X, Loader2 } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Blockers, MonoLabel } from "./ui.jsx";
import { useStore } from "../store/StoreContext.jsx";
import { useSession } from "../auth/SessionContext.jsx";

/* The state-machine action bar. Surfaces every available transition with  */
/* its blockers spelled out, gates sign-off actions to the broker, and     */
/* prompts for a reason on out-of-band moves and overrides. Nothing        */
/* advances silently.                                                      */
export default function TransitionBar({ shipment }) {
  const { availableTransitionsFor, transition } = useStore();
  const { hasSignoff } = useSession();
  const transitions = availableTransitionsFor(shipment.id);
  const [busy, setBusy] = useState(null);
  const [prompt, setPrompt] = useState(null); // {transition, reason}
  const [error, setError] = useState(null);

  const advances = transitions.filter((t) => t.kind !== "return");
  const returns = transitions.filter((t) => t.kind === "return");

  async function run(t, { reason, override } = {}) {
    setError(null);
    setBusy(t.to);
    const res = await transition(shipment.id, t.to, { reason, override });
    setBusy(null);
    if (!res.ok) setError(res.reason || (res.blockers ? res.blockers.join(" ") : "Could not complete."));
    else setPrompt(null);
  }

  function clickAdvance(t) {
    const needsSignoff = t.requiresSignoff && !hasSignoff;
    if (needsSignoff) { setError("Requires sign-off authority. Switch to a licensed broker (role switcher) to file."); return; }
    if (t.requireReason || (t.blocked && t.allowOverride)) { setPrompt({ transition: t, reason: "", override: t.blocked }); return; }
    if (t.blocked) { setError(null); return; } // blocked & no override — button is disabled, blockers shown below
    run(t);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* primary advances */}
      <div className="flex items-center" style={{ gap: 10, flexWrap: "wrap" }}>
        {advances.map((t) => {
          const needsSignoff = t.requiresSignoff;
          const disabled = (t.blocked && !t.allowOverride) || busy;
          const signoffBlocked = needsSignoff && !hasSignoff;
          return (
            <button
              key={t.to}
              onClick={() => clickAdvance(t)}
              disabled={disabled && !signoffBlocked}
              title={signoffBlocked ? "Requires sign-off authority" : undefined}
              className="flex items-center"
              style={{
                gap: 7,
                fontFamily: MONO,
                fontSize: 12,
                padding: "9px 14px",
                borderRadius: 7,
                cursor: disabled && !signoffBlocked ? "not-allowed" : "pointer",
                border: "1px solid transparent",
                background: needsSignoff ? (signoffBlocked ? C.mutedBg : C.ink) : t.blocked ? C.mutedBg : C.accent,
                color: needsSignoff ? (signoffBlocked ? C.faint : "#fff") : t.blocked ? C.faint : "#fff",
                opacity: disabled && !signoffBlocked ? 0.7 : 1,
              }}
            >
              {busy === t.to ? <Loader2 size={13} className="animate-spin" /> : needsSignoff ? <ShieldCheck size={13} /> : t.blocked ? <Lock size={13} /> : <ArrowRight size={13} />}
              {t.label}
              {needsSignoff && <span style={{ fontSize: 9, opacity: 0.85, marginLeft: 2 }}>SIGN-OFF</span>}
            </button>
          );
        })}
        {returns.map((t) => (
          <button key={t.to} onClick={() => setPrompt({ transition: t, reason: "", override: false })} className="flex items-center" style={{ gap: 6, fontFamily: MONO, fontSize: 11.5, padding: "8px 12px", borderRadius: 7, cursor: "pointer", border: `1px solid ${C.line}`, background: C.panel, color: C.sub }}>
            <RotateCcw size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* blockers for any blocked advance */}
      {advances.filter((t) => t.blocked).map((t) => (
        <Blockers key={t.to} blockers={t.blockers} title={`Blocked — “${t.label}”`} />
      ))}

      {error && (
        <div className="flex items-center" style={{ gap: 8, background: C.alertBg, border: `1px solid ${C.alertLine}`, borderRadius: 7, padding: "9px 12px" }}>
          <AlertTriangle size={13} color={C.alert} />
          <span style={{ fontSize: 12.5, color: C.alert }}>{error}</span>
        </div>
      )}

      {/* reason / override prompt */}
      {prompt && (
        <div style={{ background: C.panelAlt, border: `1px solid ${C.line}`, borderRadius: 8, padding: "12px 14px" }}>
          <MonoLabel color={prompt.override ? C.alert : C.sub}>
            {prompt.override ? "Override completeness checks — reason required" : `${prompt.transition.label} — reason required`}
          </MonoLabel>
          {prompt.override && prompt.transition.blockers?.length > 0 && (
            <ul style={{ margin: "7px 0", paddingLeft: 18, color: C.sub, fontSize: 12 }}>
              {prompt.transition.blockers.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
          <textarea
            value={prompt.reason}
            onChange={(e) => setPrompt((p) => ({ ...p, reason: e.target.value }))}
            placeholder="State the reason — logged to the audit trail."
            rows={2}
            autoFocus
            style={{ width: "100%", marginTop: 8, resize: "vertical", border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 10px", fontFamily: "inherit", fontSize: 12.5, color: C.ink, outline: "none" }}
          />
          <div className="flex items-center justify-end" style={{ gap: 9, marginTop: 9 }}>
            <button onClick={() => setPrompt(null)} className="flex items-center" style={{ gap: 5, background: "none", border: "none", cursor: "pointer", color: C.sub, fontFamily: MONO, fontSize: 11.5 }}><X size={13} /> Cancel</button>
            <button
              onClick={() => run(prompt.transition, { reason: prompt.reason, override: prompt.override })}
              disabled={!prompt.reason.trim() || busy}
              className="flex items-center"
              style={{ gap: 6, fontFamily: MONO, fontSize: 11.5, padding: "8px 13px", borderRadius: 6, cursor: prompt.reason.trim() ? "pointer" : "not-allowed", border: "none", background: prompt.reason.trim() ? (prompt.override ? C.alert : C.ink) : C.mutedBg, color: prompt.reason.trim() ? "#fff" : C.faint }}
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />} Confirm & log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
