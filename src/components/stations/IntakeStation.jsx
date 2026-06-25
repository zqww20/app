import React, { useRef, useState } from "react";
import { FileText, Upload, Loader2, Plus, CheckCircle2, AlertTriangle, ScanLine } from "lucide-react";
import { C, MONO } from "../../theme.js";
import { Panel, MonoLabel, Button, Callout, ProposedTag } from "../ui.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { DOC_TYPES } from "../../domain/constants.js";
import { extractFromFile } from "../../adapters/extraction.js";
import { money, fmtDate } from "../../lib/format.js";

const SAMPLE = [
  { description: "Hydraulic gear pump, cast iron body, 25 GPM", quantity: 4, unit_price: 312.5, currency: "USD", origin: "United States", material: "Cast iron / steel", source_field: "Line 1 — 'Hyd gear pump CI 25GPM'" },
  { description: "316 SS ball valve, 2 inch, flanged", quantity: 12, unit_price: 88, currency: "USD", origin: "United States", material: "Stainless steel 316", source_field: "Line 2 — '2\" SS ball valve FLG'" },
  { description: "Ring joint gasket R-37, soft iron", quantity: 50, unit_price: 6.4, currency: "USD", origin: "India", material: "Soft iron", source_field: "Line 3 — 'RTJ gasket R37 SI'" },
];

export default function IntakeStation({ shipment }) {
  const { addDocument, setLines, confirmIntake } = useStore();
  const fileRef = useRef(null);
  const [docType, setDocType] = useState("commercial_invoice");
  const [docName, setDocName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractErr, setExtractErr] = useState("");

  const hasLines = (shipment.lines || []).length > 0;
  const confirmed = shipment.intake?.headerConfirmed && shipment.intake?.linesConfirmed;

  async function onFile(file) {
    if (!file) return;
    setExtractErr("");
    setExtracting(true);
    const res = await extractFromFile(file);
    setExtracting(false);
    if (!res.ok) { setExtractErr(res.error); return; }
    addDocument(shipment.id, { type: "commercial_invoice", name: file.name });
    setLines(shipment.id, res.lines, { mode: "model" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* documents */}
      <Panel style={{ padding: "15px 17px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <MonoLabel>Documents · {shipment.documents.length}</MonoLabel>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>6-YEAR RETENTION · VERSIONED</span>
        </div>
        {shipment.documents.length === 0 ? (
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 12 }}>No documents yet. Upload the commercial invoice to extract line items, or record a document received by other means.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
            {shipment.documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between" style={{ border: `1px solid ${C.line}`, borderRadius: 7, padding: "8px 11px" }}>
                <div className="flex items-center" style={{ gap: 9 }}>
                  <FileText size={14} color={C.sub} />
                  <div>
                    <div style={{ fontSize: 12.5, color: C.ink }}>{d.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{DOC_TYPES[d.type] || d.type} · v{d.version}</div>
                  </div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{fmtDate(new Date(d.addedAt).toISOString().slice(0, 10))}</span>
              </div>
            ))}
          </div>
        )}

        {/* add document by record */}
        <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
          <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ fontFamily: "inherit", fontSize: 12, padding: "7px 9px", border: `1px solid ${C.line}`, borderRadius: 6, outline: "none", color: C.ink, background: C.panel }}>
            {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Document filename / reference" style={{ flex: 1, minWidth: 180, fontFamily: "inherit", fontSize: 12, padding: "7px 9px", border: `1px solid ${C.line}`, borderRadius: 6, outline: "none", color: C.ink }} />
          <Button icon={Plus} disabled={!docName.trim()} onClick={() => { if (docName.trim()) { addDocument(shipment.id, { type: docType, name: docName.trim() }); setDocName(""); } }}>Record</Button>
        </div>
      </Panel>

      {/* extraction */}
      <Panel style={{ padding: "15px 17px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <MonoLabel>Line-item extraction</MonoLabel>
          <ProposedTag />
        </div>

        {!hasLines ? (
          <div>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center text-center"
              style={{ border: `1.5px dashed ${C.line}`, borderRadius: 9, padding: "30px 20px", cursor: "pointer", background: C.panelAlt }}
            >
              <input ref={fileRef} type="file" accept=".pdf,image/png,image/jpeg,image/webp,image/gif" onChange={(e) => onFile(e.target.files?.[0])} style={{ display: "none" }} />
              {extracting ? <Loader2 size={22} color={C.accent} className="animate-spin" /> : <Upload size={20} color={C.sub} />}
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 11 }}>{extracting ? "Reading document…" : "Upload the commercial invoice"}</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>PDF or image · the model extracts each line and quotes the source field</div>
            </div>
            {extractErr && <Callout tone="warn" icon={AlertTriangle} title="Extraction unavailable">{extractErr}</Callout>}
            <div className="flex items-center justify-center" style={{ gap: 10, marginTop: 12 }}>
              <span style={{ fontSize: 12, color: C.faint }}>No file to hand?</span>
              <Button icon={ScanLine} onClick={() => setLines(shipment.id, SAMPLE, { mode: "model" })}>Load sample line items</Button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    {["#", "Description", "Qty", "Unit", "Origin", "Source field"].map((h, i) => (
                      <th key={h} style={{ padding: "6px 10px", borderBottom: `1px solid ${C.line}`, textAlign: i === 2 || i === 3 ? "right" : "left" }}><MonoLabel>{h}</MonoLabel></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shipment.lines.map((l, i) => (
                    <tr key={l.id}>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.lineSoft}`, fontFamily: MONO, color: C.faint }}>{String(i + 1).padStart(2, "0")}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.lineSoft}`, color: C.ink }}>{l.description}<div style={{ fontSize: 10.5, color: C.faint }}>{l.material || ""}</div></td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.lineSoft}`, textAlign: "right", fontFamily: MONO }}>{l.quantity ?? "—"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.lineSoft}`, textAlign: "right", fontFamily: MONO }}>{l.unit_price != null ? money(l.unit_price, l.currency) : "—"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.lineSoft}` }}>{l.origin || <span style={{ color: C.warn }}>not stated</span>}</td>
                      <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.lineSoft}`, fontFamily: MONO, fontSize: 10.5, color: C.faint }}>{l.source_field || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {confirmed ? (
              <Callout tone="good" icon={CheckCircle2} title="Intake confirmed">
                Header and {shipment.lines.length} line{shipment.lines.length === 1 ? "" : "s"} verified against the source documents. The file can advance to classification.
              </Callout>
            ) : (
              <div style={{ marginTop: 13 }}>
                <Callout tone="warn" icon={AlertTriangle} title="Extraction is assistance — acceptance is human">
                  Verify each extracted value against the document above, then confirm. This is the intake checkpoint; the file cannot advance until you do.
                </Callout>
                <div className="flex items-center justify-end" style={{ marginTop: 12 }}>
                  <Button variant="primary" icon={CheckCircle2} onClick={() => confirmIntake(shipment.id)}>Confirm header & {shipment.lines.length} lines</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
