import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Stamp as StampIcon, Check, Pencil, X, CheckCircle2, ChevronRight, ShieldAlert } from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, Stat, MonoLabel, PageHeader, Button, ConfidenceBar, EmptyState } from "../components/ui.jsx";
import HonestyBanner from "../components/HonestyBanner.jsx";
import { ENTRIES, clientById } from "../data/mockData.js";
import { classify, isCleared, CLEAR_THRESHOLD } from "../lib/classify.js";
import { money, pct } from "../lib/format.js";

/* Collect every low-confidence line across non-filed entries — the      */
/* broker's single triage queue. Each carries enough context to decide    */
/* without opening the parent entry.                                      */
function buildQueue() {
  const items = [];
  for (const e of ENTRIES) {
    if (e.status === "filed") continue;
    e.lines.forEach((line, idx) => {
      const cls = classify(line.description);
      if (!isCleared(cls.conf)) {
        items.push({ key: `${e.id}-${idx}`, entry: e, line, cls, client: clientById(e.clientId) });
      }
    });
  }
  return items.sort((a, b) => a.cls.conf - b.cls.conf); // most uncertain first
}

export default function BrokerReview() {
  const queue = buildQueue();
  const [decisions, setDecisions] = useState({});
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState({});

  const handled = Object.keys(decisions).length;
  const remaining = queue.length - handled;

  function confirm(key) {
    setDecisions((d) => ({ ...d, [key]: { state: "confirmed" } }));
  }
  function startEdit(key, current) {
    setEditing(key);
    setDraft(current === "—" ? "" : current);
  }
  function save(key) {
    setDecisions((d) => ({ ...d, [key]: { state: "overridden", code: draft.trim() || "—" } }));
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="HUMAN IN THE LOOP"
        title="Broker review"
        sub="Every line the engine wasn't confident enough to stage on its own, ranked most-uncertain first. Confirm the proposed code or override it — nothing files until you do."
        right={
          <div className="flex items-center" style={{ gap: 20 }}>
            <Stat label="In queue" value={queue.length} />
            <Stat label="Handled" value={handled} color={C.green} />
            <Stat label="Remaining" value={remaining} color={remaining ? C.amber : C.green} />
          </div>
        }
      />

      <HonestyBanner compact />

      {queue.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Queue clear">
          No lines are waiting on a broker decision.
        </EmptyState>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {queue.map((item, i) => {
            const { key, entry, line, cls, client } = item;
            const decision = decisions[key];
            const isEditing = editing === key;
            const isOpen = open[key];
            const done = !!decision;

            return (
              <Panel
                key={key}
                className="mf-row"
                style={{ padding: 0, overflow: "hidden", animationDelay: `${i * 50}ms`, opacity: done ? 0.72 : 1, transition: "opacity .2s" }}
              >
                <div style={{ padding: "14px 16px" }}>
                  <div className="flex items-start justify-between" style={{ gap: 14 }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="flex items-center" style={{ gap: 9, marginBottom: 6 }}>
                        <Link to={`/entries/${entry.id}`} style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: C.stamp, textDecoration: "none" }}>
                          {entry.id}
                        </Link>
                        <span style={{ fontSize: 11.5, color: C.faint }}>{client?.name}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>· origin {line.origin || "—"}</span>
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3 }}>{line.description}</div>
                      <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.sub, marginTop: 5 }}>
                        {line.quantity || 1} {line.unit_price != null ? `× ${money(line.unit_price)} ${line.currency || ""}` : "units"}
                        {line.material ? `  ·  ${line.material}` : ""}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <ConfidenceBar conf={cls.conf} color={C.amber} width={72} />
                    </div>
                  </div>

                  {/* proposed code */}
                  <div className="flex items-baseline" style={{ gap: 11, marginTop: 12, flexWrap: "wrap" }}>
                    <MonoLabel>AI proposes</MonoLabel>
                    <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: cls.hs === "—" ? C.faint : C.ink }}>{cls.hs}</span>
                    <span style={{ fontSize: 12.5, color: C.sub }}>{cls.h}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.sub }}>· duty {pct(cls.r)}</span>
                  </div>

                  <button
                    onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
                    className="flex items-center"
                    style={{ gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, color: C.sub, fontFamily: MONO, fontSize: 11, marginTop: 10 }}
                  >
                    <ChevronRight size={12} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                    {isOpen ? "Hide why it's flagged" : "Why it's flagged"}
                  </button>
                  {isOpen && (
                    <div style={{ marginTop: 9, background: C.amberBg, border: `1px solid ${C.amberLine}`, borderRadius: 7, padding: "10px 12px" }}>
                      <div className="flex" style={{ gap: 8 }}>
                        <ShieldAlert size={13} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
                        <div style={{ fontSize: 12.5, color: "#4A3A2A", lineHeight: 1.5 }}>{cls.g}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* decision bar */}
                <div
                  className="flex items-center justify-between"
                  style={{ borderTop: `1px solid ${C.line}`, padding: "10px 16px", background: C.panelAlt, gap: 10, flexWrap: "wrap" }}
                >
                  {decision?.state === "confirmed" ? (
                    <span className="inline-flex items-center" style={{ gap: 6, fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.green }}>
                      <CheckCircle2 size={14} /> CONFIRMED — {cls.hs} accepted as filed code
                    </span>
                  ) : decision?.state === "overridden" ? (
                    <span className="inline-flex items-center" style={{ gap: 6, fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.blue }}>
                      <Pencil size={12} /> OVERRIDDEN — filed code {decision.code}
                    </span>
                  ) : isEditing ? (
                    <div className="flex items-center" style={{ gap: 8 }}>
                      <MonoLabel>Override to</MonoLabel>
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                        placeholder="HS code"
                        onKeyDown={(e) => e.key === "Enter" && save(key)}
                        style={{ fontFamily: MONO, fontSize: 12, padding: "6px 9px", border: `1px solid ${C.blue}`, borderRadius: 6, width: 160, outline: "none", color: C.ink }}
                      />
                      <Button variant="primary" icon={Check} onClick={() => save(key)} style={{ padding: "6px 11px" }}>
                        Save override
                      </Button>
                      <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.faint }}>
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.faint }}>
                      Awaiting decision · confidence below {Math.round(CLEAR_THRESHOLD * 100)}% threshold
                    </span>
                  )}

                  {!done && !isEditing && (
                    <div className="flex items-center" style={{ gap: 8 }}>
                      <button
                        onClick={() => startEdit(key, cls.hs)}
                        className="flex items-center"
                        style={{ gap: 6, background: C.panel, border: `1px solid ${C.line}`, color: C.sub, borderRadius: 6, padding: "6px 11px", cursor: "pointer", fontFamily: MONO, fontSize: 11 }}
                      >
                        <Pencil size={12} /> Override
                      </button>
                      <button
                        onClick={() => confirm(key)}
                        className="flex items-center"
                        style={{ gap: 6, background: C.ink, border: "none", color: "#fff", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontFamily: MONO, fontSize: 11 }}
                      >
                        <Check size={12} /> Confirm code
                      </button>
                    </div>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
