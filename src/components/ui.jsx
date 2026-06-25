import React from "react";
import { AlertTriangle, Lock, Info } from "lucide-react";
import { C, MONO, toneOf } from "../theme.js";
import { stateOf } from "../domain/constants.js";

/* ------------------------------------------------------------------ */
/*  Operational primitives. Plain, dense, sentence-case. Labels name     */
/*  what the user controls; nothing decorative.                          */
/* ------------------------------------------------------------------ */

export function Panel({ children, style, className, pad, ...rest }) {
  return (
    <div
      className={className}
      style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 9, ...(pad ? { padding: pad } : {}), ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function MonoLabel({ children, color, style }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.11em", textTransform: "uppercase", color: color || C.faint, ...style }}>
      {children}
    </span>
  );
}

export function Stat({ label, value, color, sub }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: color || C.ink, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: C.sub, marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Field({ label, value, mono, vColor, hint }) {
  return (
    <div>
      <MonoLabel>{label}</MonoLabel>
      <div style={{ fontFamily: mono ? MONO : undefined, fontSize: 13, color: vColor || C.ink, marginTop: 4 }}>{value ?? "—"}</div>
      {hint && <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

export function Meta({ k, v, vColor }) {
  return (
    <div className="flex items-center" style={{ gap: 7 }}>
      <MonoLabel>{k}</MonoLabel>
      <span style={{ fontFamily: MONO, fontSize: 12, color: vColor || C.ink }}>{v}</span>
    </div>
  );
}

/* shipment / line state pill, coloured by its tone */
export function StateBadge({ state, size = "md" }) {
  const s = stateOf(state);
  const t = toneOf(s.tone);
  const pad = size === "sm" ? "3px 8px" : "4px 10px";
  const fs = size === "sm" ? 9.5 : 10.5;
  return (
    <span
      className="inline-flex items-center"
      style={{ gap: 6, background: t.bg, border: `1px solid ${t.line}`, color: t.color, borderRadius: 999, padding: pad, fontFamily: MONO, fontSize: fs, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", whiteSpace: "nowrap" }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 999, background: t.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

export function Tag({ children, tone = "neutral", icon: Icon }) {
  const t = toneOf(tone);
  return (
    <span className="inline-flex items-center" style={{ gap: 5, background: t.bg, border: `1px solid ${t.line}`, color: t.color, borderRadius: 999, padding: "3px 9px", fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.03em" }}>
      {Icon && <Icon size={11} color={t.color} />}
      {children}
    </span>
  );
}

export function ConfidenceBar({ conf, width = 78 }) {
  const c = conf >= 0.8 ? C.good : conf >= 0.5 ? C.warn : C.alert;
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      <MonoLabel>Confidence</MonoLabel>
      <div style={{ width, height: 5, background: C.lineSoft, borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${Math.round(conf * 100)}%`, height: "100%", background: c }} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: c }}>{Math.round(conf * 100)}%</span>
    </div>
  );
}

export function Button({ children, variant = "default", icon: Icon, style, ...rest }) {
  const base = { display: "inline-flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 12, borderRadius: 6, padding: "8px 13px", cursor: "pointer", transition: "all .13s", border: "1px solid transparent", whiteSpace: "nowrap" };
  const variants = {
    default: { background: C.panel, border: `1px solid ${C.line}`, color: C.ink },
    primary: { background: C.accent, color: "#fff" },
    ink: { background: C.ink, color: "#fff" },
    danger: { background: C.alertBg, border: `1px solid ${C.alertLine}`, color: C.alert },
    ghost: { background: "transparent", color: C.sub },
    disabled: { background: C.mutedBg, border: `1px solid ${C.line}`, color: C.faint, cursor: "not-allowed" },
  };
  const v = rest.disabled ? variants.disabled : variants[variant] || variants.default;
  return (
    <button style={{ ...base, ...v, ...style }} {...rest}>
      {Icon && <Icon size={13} />}
      {children}
    </button>
  );
}

export function PageHeader({ eyebrow, title, sub, right }) {
  return (
    <div className="flex items-start justify-between" style={{ gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
      <div>
        {eyebrow && <MonoLabel style={{ color: C.sub }}>{eyebrow}</MonoLabel>}
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", marginTop: eyebrow ? 6 : 0 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: C.sub, marginTop: 5, maxWidth: 660, lineHeight: 1.5 }}>{sub}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <Panel style={{ padding: "40px 26px", textAlign: "center" }}>
      {Icon && (
        <div style={{ width: 44, height: 44, borderRadius: 999, background: C.mutedBg, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 13 }}>
          <Icon size={19} color={C.sub} />
        </div>
      )}
      <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
      {children && <div style={{ fontSize: 13, color: C.sub, marginTop: 6, lineHeight: 1.5, maxWidth: 460, margin: "6px auto 0" }}>{children}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </Panel>
  );
}

/* "Fail loudly and specifically": a blockers list with the unblocking    */
/* steps spelled out in operational language.                            */
export function Blockers({ blockers, title = "Blocked — resolve before advancing" }) {
  if (!blockers?.length) return null;
  return (
    <div style={{ background: C.alertBg, border: `1px solid ${C.alertLine}`, borderRadius: 8, padding: "11px 13px" }}>
      <div className="flex items-center" style={{ gap: 7, marginBottom: 7 }}>
        <Lock size={13} color={C.alert} />
        <MonoLabel color={C.alert}>{title}</MonoLabel>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, color: "#5A3033", fontSize: 12.5, lineHeight: 1.55 }}>
        {blockers.map((b, i) => (
          <li key={i} style={{ marginBottom: 3 }}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

export function Callout({ tone = "info", icon: Icon = Info, title, children }) {
  const t = toneOf(tone);
  return (
    <div className="flex" style={{ gap: 10, background: t.bg, border: `1px solid ${t.line}`, borderRadius: 8, padding: "11px 13px" }}>
      <Icon size={14} color={t.color} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        {title && <MonoLabel color={t.color} style={{ display: "block", marginBottom: 4 }}>{title}</MonoLabel>}
        <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>{children}</div>
      </div>
    </div>
  );
}

/* "AI proposed — not filed" marker, used wherever the assistant drafts.   */
export function ProposedTag() {
  return <Tag tone="info" icon={AlertTriangle}>AI PROPOSED · NOT FILED</Tag>;
}
