/**
 * Lightweight API request logger + performance tracker.
 * Only active in development (import.meta.env.DEV).
 *
 * Usage:
 *   const log = useApiLogger("crmService");
 *   const t = log.start("getAllFunnels");
 *   const data = await supabase.from("funnels").select(...);
 *   log.end(t, "getAllFunnels", data?.length);
 */

const IS_DEV = import.meta.env.DEV;

// ── In-memory request registry for deduplication warnings ────────────────────
const _inFlight = new Map();          // key → timestamp
const _counts   = new Map();          // key → call count in this session
let   _sessionStart = Date.now();

function _bump(key) {
  _counts.set(key, (_counts.get(key) || 0) + 1);
}

export function useApiLogger(namespace = "api") {
  if (!IS_DEV) {
    return {
      start: () => null,
      end:   () => null,
      warn:  () => null,
      stats: () => null,
    };
  }

  const prefix = `%c[${namespace}]`;
  const style  = "color:#6c8fff;font-weight:700";

  return {
    /** Call before the request — returns a start timestamp. */
    start(label) {
      const key = `${namespace}::${label}`;
      _bump(key);
      if (_inFlight.has(key)) {
        console.warn(prefix + ` ⚠ Duplicate in-flight request: ${label}`, style);
      }
      const t = performance.now();
      _inFlight.set(key, t);
      return { key, t };
    },

    /** Call after the request — logs duration and result size. */
    end(handle, label, resultSize) {
      if (!handle) return;
      const { key, t } = handle;
      const ms = (performance.now() - t).toFixed(1);
      _inFlight.delete(key);
      const count = _counts.get(key) || 1;
      const sizeStr = resultSize !== undefined ? ` · ${resultSize} rows` : "";
      const slow = ms > 800 ? " 🐢" : "";
      console.debug(
        prefix + ` ${label} — ${ms}ms${sizeStr}${slow} (call #${count})`,
        style
      );
    },

    /** Log a custom warning. */
    warn(msg) {
      console.warn(prefix + ` ⚠ ${msg}`, style);
    },

    /** Print a summary of all API call counts since session start. */
    stats() {
      const elapsed = ((Date.now() - _sessionStart) / 1000).toFixed(0);
      console.group(`%c[${namespace}] API stats — ${elapsed}s session`, style);
      const sorted = [..._counts.entries()].sort((a, b) => b[1] - a[1]);
      sorted.forEach(([k, v]) => console.log(`  ${k}: ${v} call${v > 1 ? "s" : ""}`));
      console.groupEnd();
    },
  };
}

// Expose stats globally in dev so devtools console can call: window.__apiStats()
if (IS_DEV) {
  window.__apiStats = () => {
    const elapsed = ((Date.now() - _sessionStart) / 1000).toFixed(0);
    console.group(`API call stats — ${elapsed}s session`);
    [..._counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`  ${k}: ${v}`));
    console.groupEnd();
  };
}
