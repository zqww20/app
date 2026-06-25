import React from "react";
import { AlertTriangle } from "lucide-react";
import { C } from "../theme.js";

/* The prototype's standing disclaimer: extraction is real, codes are    */
/* illustrative and broker-gated. Shown on the AI-bearing views.         */
export default function HonestyBanner({ compact = false }) {
  return (
    <div
      className="flex"
      style={{
        gap: 10,
        background: C.amberBg,
        border: `1px solid ${C.amberLine}`,
        borderRadius: 6,
        padding: compact ? "8px 12px" : "10px 13px",
        marginBottom: compact ? 14 : 18,
      }}
    >
      <AlertTriangle size={15} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: compact ? 12 : 12.5, color: "#6E4A14", lineHeight: 1.5 }}>
        Illustrative prototype. Line-item extraction is real — the model reads your invoice.{" "}
        <b>HS codes are mock-generated to demonstrate the workflow, not customs advice.</b> Every
        code is AI-proposed and must be confirmed by a licensed broker before any entry is filed.
      </div>
    </div>
  );
}
