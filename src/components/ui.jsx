import React from "react";
import { C, MONO, statusOf } from "../theme.js";

/* ------------------------------------------------------------------ */
/*  Shared primitives — the visual vocabulary of the workspace.        */
/*  Kept inline-styled (like the seed) so tokens stay in one place.    */
/* ------------------------------------------------------------------ */

export function Panel({ children, style, className, ...rest }) {
  return (
    <div
      className={className}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* Uppercase monospace caption — the "form label" voice. */
export function MonoLabel({ children, color, style }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: color || C.faint,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value, color, sub }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 600, color: color || C.ink, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: C.sub, marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>{sub}</div>}
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

/* Pill used for entry/line status throughout. */
export function StatusBadge({ status, size = "md" }) {
  const s = statusOf(status);
  const pad = size === "sm" ? "3px 8px" : "4px 10px";
  const fs = size === "sm" ? 9.5 : 10.5;
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 6,
        background: s.bg,
        border: `1px solid ${s.line}`,
        color: s.color,
        borderRadius: 999,
        padding: pad,
        fontFamily: MONO,
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 999, background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

/* Generic tag, e.g. for confidence states. */
export function Tag({ children, color = C.sub, bg = "#EEF0F3", line = C.line, icon: Icon }) {
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 5,
        background: bg,
        border: `1px solid ${line}`,
        color,
        borderRadius: 999,
        padding: "3px 9px",
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
      }}
    >
      {Icon && <Icon size={11} color={color} />}
      {children}
    </span>
  );
}

export function ConfidenceBar({ conf, color, width = 84 }) {
  const c = color || (conf >= 0.8 ? C.green : C.amber);
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      <MonoLabel>Confidence</MonoLabel>
      <div style={{ width, height: 5, background: "#EDEFF2", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${Math.round(conf * 100)}%`, height: "100%", background: c }} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: c }}>
        {Math.round(conf * 100)}%
      </span>
    </div>
  );
}

/* The signature "stamp" — used on summaries and headers. */
export function Stamp({ top = "AI-PROPOSED", bottom = "PENDING BROKER", animate = true, color = C.stamp }) {
  return (
    <div
      style={{
        animation: animate ? "mfStamp .55s ease-out" : "none",
        transform: "rotate(-7deg)",
        fontFamily: MONO,
        color,
        border: `2px solid ${color}`,
        boxShadow: `inset 0 0 0 2px ${C.panel}, inset 0 0 0 3.5px ${color}`,
        borderRadius: 4,
        padding: "5px 9px",
        textAlign: "center",
        lineHeight: 1.25,
        opacity: 0.92,
        userSelect: "none",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em" }}>{top}</div>
      <div style={{ fontSize: 7.5, letterSpacing: "0.12em" }}>{bottom}</div>
    </div>
  );
}

export function Button({ children, variant = "default", icon: Icon, style, ...rest }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontFamily: MONO,
    fontSize: 12,
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
    transition: "all .14s",
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };
  const variants = {
    default: { background: C.panel, border: `1px solid ${C.line}`, color: C.ink },
    primary: { background: C.ink, color: "#fff" },
    stamp: { background: C.stamp, color: "#fff" },
    ghost: { background: "transparent", color: C.sub },
    disabled: { background: "#EEF0F3", border: `1px solid ${C.line}`, color: C.faint, cursor: "not-allowed" },
  };
  const v = rest.disabled ? variants.disabled : variants[variant] || variants.default;
  return (
    <button style={{ ...base, ...v, ...style }} {...rest}>
      {Icon && <Icon size={13} />}
      {children}
    </button>
  );
}

/* Page header used at the top of each view. */
export function PageHeader({ eyebrow, title, sub, right }) {
  return (
    <div className="flex items-start justify-between" style={{ gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
      <div>
        {eyebrow && <MonoLabel style={{ color: C.stamp }}>{eyebrow}</MonoLabel>}
        <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-0.01em", marginTop: eyebrow ? 6 : 0 }}>
          {title}
        </div>
        {sub && <div style={{ fontSize: 13.5, color: C.sub, marginTop: 5, maxWidth: 620, lineHeight: 1.5 }}>{sub}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <Panel style={{ padding: "44px 26px", textAlign: "center" }}>
      {Icon && (
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            background: "#EEF1F4",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Icon size={20} color={C.sub} />
        </div>
      )}
      <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
      {children && <div style={{ fontSize: 13, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>{children}</div>}
    </Panel>
  );
}
