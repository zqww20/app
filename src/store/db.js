import { buildSeed } from "./seed.js";

/* localStorage-backed persistence. The whole workspace state is one      */
/* JSON document; mutations save it back. A real backend implements the   */
/* same load()/save() seam.                                               */

const KEY = "cbsa_workspace_v3";

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seed = buildSeed();
      save(seed);
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 3) {
      const seed = buildSeed();
      save(seed);
      return seed;
    }
    return parsed;
  } catch {
    return buildSeed();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full / unavailable — non-fatal for the prototype */
  }
}

export function resetWorkspace() {
  const seed = buildSeed();
  save(seed);
  return seed;
}
