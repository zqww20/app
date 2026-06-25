export const money = (n, currency) => {
  if (n == null || isNaN(n)) return null;
  const s = `$${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  return currency && currency !== "USD" ? `${s} ${currency}` : s;
};

export const money0 = (n) => {
  if (n == null || isNaN(n)) return null;
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

export const pct = (r, digits = 1) => {
  if (r == null) return "—";
  if (r === 0) return "Free";
  return `${(r * 100).toFixed(digits)}%`;
};

/* Line-item duty: rate × extended value (qty × unit price). */
export const lineValue = (line) =>
  line.unit_price == null ? null : line.unit_price * (line.quantity || 1);

export const lineDuty = (line, cls) => {
  const v = lineValue(line);
  if (cls?.r == null || v == null) return null;
  return v * cls.r;
};

/* Relative day label from an offset vs. "today" (the prototype clock). */
export function dayLabel(offset) {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  if (offset === -1) return "Yesterday";
  if (offset < 0) return `${Math.abs(offset)}d ago`;
  return `in ${offset}d`;
}

export function initials(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
