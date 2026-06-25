/* Short, human-legible ids. Runtime app code (browser) may use Date/    */
/* Math.random freely.                                                   */
let seq = 0;
function bump() {
  seq = (seq + 1) % 100000;
  return seq;
}

export function uid(prefix = "id") {
  const t = Date.now().toString(36).slice(-5);
  const r = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${t}${r}${bump()}`;
}

/* Operational reference numbers, e.g. SHP-26-0142. `year` is the        */
/* two-digit operational year; `n` a zero-padded sequence.               */
export function shipmentNo(n, year = "26") {
  return `SHP-${year}-${String(n).padStart(4, "0")}`;
}
