import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  FileText,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Send,
  Stamp as StampIcon,
  ArrowRight,
} from "lucide-react";
import { C, MONO } from "../theme.js";
import { Panel, Stat, MonoLabel, PageHeader, Button, Stamp } from "../components/ui.jsx";
import ClassificationRow from "../components/ClassificationRow.jsx";
import HonestyBanner from "../components/HonestyBanner.jsx";
import { classify, isCleared } from "../lib/classify.js";
import { money } from "../lib/format.js";
import { lineValue, lineDuty } from "../lib/format.js";
import { SAMPLE_INVOICE } from "../data/mockData.js";

/* The original Manifest prototype, rehomed as the workspace's intake.  */
/* Extraction is real (Claude vision reads the invoice); classification  */
/* is the mock engine. Output stages into broker review.                 */

const MEDIA = {
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/webp": "image/webp",
  "image/gif": "image/gif",
  "application/pdf": "application/pdf",
};

function parseLines(text) {
  const cleaned = (text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  let arr;
  try {
    arr = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\[[\s\S]*\]/);
    try {
      arr = m ? JSON.parse(m[0]) : [];
    } catch {
      arr = [];
    }
  }
  return Array.isArray(arr) ? arr : [];
}

export default function ClassifyIntake() {
  const [stage, setStage] = useState("idle"); // idle | reading | done | error
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const [queued, setQueued] = useState({});
  const inputRef = useRef(null);

  function reset() {
    setStage("idle");
    setRows([]);
    setErr("");
    setFileName("");
    setQueued({});
    if (inputRef.current) inputRef.current.value = "";
  }

  function ingest(lines, name) {
    if (!lines.length) {
      setErr("Couldn't find invoice line items in that file. Try a clearer commercial invoice, or load the sample.");
      setStage("error");
      return;
    }
    const built = lines.slice(0, 14).map((l) => ({ ...l, cls: classify(l.description) }));
    setRows(built);
    setFileName(name || "");
    setStage("done");
  }

  async function handleFile(file) {
    if (!file) return;
    const mt = MEDIA[file.type];
    if (!mt) {
      setErr("Unsupported file. Upload a PDF or an image (PNG, JPG, WEBP).");
      setStage("error");
      return;
    }
    setStage("reading");
    setErr("");
    setFileName(file.name);
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1]);
        r.onerror = () => rej(new Error("read"));
        r.readAsDataURL(file);
      });
      const block =
        mt === "application/pdf"
          ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }
          : { type: "image", source: { type: "base64", media_type: mt, data: b64 } };
      const prompt = `You are parsing a commercial / customs invoice. Return ONLY a JSON array (no prose, no markdown fences) of the goods line items being shipped. Each element: {"description": string, "quantity": number, "unit_price": number|null, "currency": string|null, "origin": string|null, "material": string|null}. Use null where a field is not stated. Ignore totals, taxes, freight, and header fields.`;
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: [block, { type: "text", text: prompt }] }],
        }),
      });
      const data = await resp.json();
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      ingest(parseLines(text), file.name);
    } catch (e) {
      setErr("Extraction failed reaching the model. Check the connection and retry, or load the sample to see the workflow.");
      setStage("error");
    }
  }

  function loadSample() {
    setStage("reading");
    setFileName("sample-invoice.pdf");
    setTimeout(() => ingest(SAMPLE_INVOICE, "sample-invoice.pdf"), 650);
  }

  const cleared = rows.filter((r) => isCleared(r.cls.conf)).length;
  const review = rows.length - cleared;
  const value = rows.reduce((s, r) => s + (lineValue(r) || 0), 0);
  const dutyEst = rows.reduce((s, r) => s + (lineDuty(r, r.cls) || 0), 0);
  const allQueued = rows.length > 0 && rows.every((_, i) => queued[i]);

  return (
    <div>
      <PageHeader
        eyebrow="INTAKE"
        title="Classify an invoice"
        sub="Drop a commercial invoice. The model extracts each line item and proposes a tariff code; you stage the lines into broker review."
      />

      <HonestyBanner />

      {/* IDLE */}
      {stage === "idle" && (
        <div>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className="flex flex-col items-center justify-center text-center"
            style={{
              background: drag ? "#EEF1F4" : C.panel,
              border: `1.5px dashed ${drag ? C.stamp : C.line}`,
              borderRadius: 10,
              padding: "48px 24px",
              transition: "all .15s",
              cursor: "pointer",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => handleFile(e.target.files?.[0])}
              style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
            />
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 999,
                background: "#EEF1F4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Upload size={20} color={C.sub} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 5 }}>Drop a commercial invoice</div>
            <div style={{ fontSize: 13, color: C.sub }}>PDF or image · the model extracts each line and proposes a tariff code</div>
          </label>
          <div className="flex items-center justify-center" style={{ gap: 10, marginTop: 16 }}>
            <span style={{ fontSize: 12.5, color: C.faint }}>No invoice handy?</span>
            <Button onClick={loadSample}>Load sample invoice</Button>
          </div>
        </div>
      )}

      {/* READING */}
      {stage === "reading" && (
        <Panel className="flex flex-col items-center justify-center text-center" style={{ padding: "52px 24px" }}>
          <Loader2 size={26} color={C.stamp} className="animate-spin" />
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 16 }}>Reading {fileName || "invoice"}</div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.sub, marginTop: 6 }}>
            Extracting line items · proposing HS codes
          </div>
        </Panel>
      )}

      {/* ERROR */}
      {stage === "error" && (
        <Panel style={{ padding: "30px 26px" }}>
          <div className="flex items-center" style={{ gap: 9, marginBottom: 8 }}>
            <AlertTriangle size={17} color={C.amber} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>Nothing to classify yet</span>
          </div>
          <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.55, marginBottom: 18 }}>{err}</div>
          <div className="flex" style={{ gap: 10 }}>
            <Button variant="primary" onClick={reset}>Try another file</Button>
            <Button onClick={loadSample}>Load sample invoice</Button>
          </div>
        </Panel>
      )}

      {/* DONE */}
      {stage === "done" && (
        <div>
          <Panel style={{ padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, overflow: "hidden" }}>
            <div className="flex" style={{ gap: 26, flexWrap: "wrap" }}>
              <Stat label="Line items" value={rows.length} />
              <Stat label="Cleared to stage" value={cleared} color={C.green} />
              <Stat label="Need review" value={review} color={review ? C.amber : C.green} />
              <Stat label="Est. duty (illustrative)" value={dutyEst > 0 ? money(dutyEst) : "Free"} />
            </div>
            <div style={{ flexShrink: 0 }}>
              <Stamp top="AI-PROPOSED" bottom="PENDING BROKER" />
            </div>
          </Panel>

          <div className="flex items-center justify-between" style={{ marginBottom: 11 }}>
            <MonoLabel>Extracted from {fileName}</MonoLabel>
            {allQueued && (
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.green }}>✓ All {rows.length} lines staged for broker review</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {rows.map((r, i) => {
              const ok = isCleared(r.cls.conf);
              const actions = queued[i] ? (
                <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, color: C.green, letterSpacing: "0.04em" }}>
                  ✓ QUEUED FOR BROKER
                </span>
              ) : (
                <button
                  onClick={() => setQueued((q) => ({ ...q, [i]: true }))}
                  className="flex items-center"
                  style={{ gap: 6, background: C.panel, border: `1px solid ${ok ? C.line : C.stamp}`, color: ok ? C.ink : C.stamp, borderRadius: 6, padding: "6px 11px", cursor: "pointer", fontFamily: MONO, fontSize: 11 }}
                >
                  <Send size={12} />
                  {ok ? "Confirm at broker review" : "Send to broker review"}
                </button>
              );
              return <ClassificationRow key={i} line={r} cls={r.cls} index={i} delay={i * 80} actions={actions} />;
            })}
          </div>

          {/* footer */}
          <div className="flex items-center justify-between" style={{ marginTop: 18, flexWrap: "wrap", gap: 12 }}>
            <button
              onClick={reset}
              className="flex items-center"
              style={{ gap: 7, background: "none", border: "none", cursor: "pointer", color: C.sub, fontFamily: MONO, fontSize: 12 }}
            >
              <RotateCcw size={13} /> Classify another invoice
            </button>
            <div className="flex items-center" style={{ gap: 9 }}>
              <Link to="/review" style={{ textDecoration: "none" }}>
                <Button icon={ArrowRight}>Open broker review</Button>
              </Link>
              <Button variant="disabled" disabled icon={FileText}>
                Export B3-3 draft
              </Button>
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>
            MOCK CLASSIFICATION ENGINE · CODES ILLUSTRATIVE · NOT A CUSTOMS DECLARATION
          </div>
        </div>
      )}
    </div>
  );
}
