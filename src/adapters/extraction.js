/* ------------------------------------------------------------------ */
/*  Document extraction adapter.                                       */
/*  The one genuinely model-driven step: Claude vision reads an         */
/*  uploaded commercial invoice and returns structured line items with  */
/*  the source field quoted, so a clerk verifies rather than re-keys.   */
/*  Extraction is assistance; acceptance is always human (intake gate). */
/* ------------------------------------------------------------------ */

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

const PROMPT = `You are parsing a commercial / customs invoice for a Canadian customs broker. Return ONLY a JSON array (no prose, no markdown fences) of the goods line items being shipped. Each element: {"description": string, "quantity": number, "unit_price": number|null, "currency": string|null, "origin": string|null, "material": string|null, "source_field": string|null}. "source_field" quotes the exact text/cell on the document the values came from, so a clerk can verify without re-keying. Use null where a field is not stated — never invent a value. Ignore totals, taxes, freight, and header-only fields.`;

/* Returns { ok, lines, mode } or { ok:false, error } — the caller turns  */
/* this into the intake review set the clerk confirms.                    */
export async function extractFromFile(file) {
  const mt = MEDIA[file?.type];
  if (!mt) {
    return { ok: false, error: "Unsupported file. Upload a PDF or an image (PNG, JPG, WEBP)." };
  }
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
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: [block, { type: "text", text: PROMPT }] }],
      }),
    });
    const data = await resp.json();
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const lines = parseLines(text);
    if (!lines.length) return { ok: false, error: "No line items could be read from that document. Try a clearer commercial invoice, or enter lines manually." };
    return { ok: true, lines, mode: "model" };
  } catch {
    return { ok: false, error: "Extraction could not reach the model. Check the connection and retry, or enter lines manually." };
  }
}

export { parseLines };
