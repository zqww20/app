import React from "react";
import { Check } from "lucide-react";
import { C, MONO } from "../theme.js";
import { STAGES, stateOf } from "../domain/constants.js";

/* Horizontal lifecycle rail. Marks done / current / upcoming stages and  */
/* lets the user jump to a station. The file's journey, made legible.     */
export default function StageRail({ state, activeStage, onPick }) {
  const currentStage = stateOf(state).stage;
  const idx = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="flex items-center" style={{ gap: 0, overflowX: "auto", padding: "2px 0" }}>
      {STAGES.map((s, i) => {
        const done = i < idx;
        const current = s.id === currentStage;
        const active = s.id === activeStage;
        const color = done ? C.good : current ? C.accent : C.faint;
        return (
          <React.Fragment key={s.id}>
            <button
              onClick={() => onPick?.(s.id)}
              className="flex items-center"
              style={{ gap: 7, background: active ? C.panel : "transparent", border: `1px solid ${active ? C.line : "transparent"}`, borderRadius: 7, padding: "6px 9px", cursor: "pointer", flexShrink: 0 }}
            >
              <span style={{ width: 18, height: 18, borderRadius: 999, background: done ? C.good : current ? C.accent : C.mutedBg, color: done || current ? "#fff" : C.faint, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 9.5, fontWeight: 600, flexShrink: 0 }}>
                {done ? <Check size={11} /> : i + 1}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: active || current ? 600 : 500, color: active ? C.ink : color, whiteSpace: "nowrap" }}>{s.label}</span>
            </button>
            {i < STAGES.length - 1 && <span style={{ width: 14, height: 1, background: C.line, flexShrink: 0 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
