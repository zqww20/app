import { fxRate } from "../reference/referenceData.js";
import { TODAY } from "../domain/stateMachine.js";

export const money = (n, ccy) => {
  if (n == null || isNaN(n)) return null;
  const s = `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return ccy && ccy !== "CAD" ? `${s} ${ccy}` : s;
};

export const money0 = (n) => {
  if (n == null || isNaN(n)) return null;
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export const cad = (n) => {
  if (n == null || isNaN(n)) return null;
  return `CAD $${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const pct = (r, digits = 1) => {
  if (r == null) return "—";
  if (r === 0) return "Free";
  return `${(r * 100).toFixed(digits)}%`;
};

/* Convert a foreign amount to CAD at the dated reference rate. Returns   */
/* null (never a guess) when the currency isn't in the FX reference set.  */
export function toCad(amount, ccy) {
  if (amount == null || isNaN(amount)) return null;
  const rate = fxRate(ccy || "CAD");
  if (rate == null) return null;
  return amount * rate;
}

export const initials = (name) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/* Whole-day difference between an ISO date and the prototype "today".   */
export function daysFromToday(iso) {
  if (!iso) return null;
  const a = Date.parse(iso + "T00:00:00");
  const b = Date.parse(TODAY + "T00:00:00");
  if (isNaN(a) || isNaN(b)) return null;
  return Math.round((a - b) / 86400000);
}

export function relativeDay(iso) {
  const d = daysFromToday(iso);
  if (d == null) return "—";
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  if (d < 0) return `${Math.abs(d)}d ago`;
  return `in ${d}d`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
}

/* "3m ago", "2h ago" from a millisecond timestamp. */
export function timeAgo(ts) {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const extValue = (line) => (line.unit_price == null ? null : line.unit_price * (line.quantity || 1));
