import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * silence. Useful for search inputs — prevents an API call on every keystroke.
 *
 * @param {*}      value  The raw (fast-changing) value.
 * @param {number} delay  Debounce window in ms (default 400).
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/**
 * Returns a stable debounced *callback*. The underlying function is always
 * the latest version (no stale-closure problem).
 *
 * @param {Function} fn    Callback to debounce.
 * @param {number}   delay Debounce window in ms (default 400).
 */
export function useDebouncedCallback(fn, delay = 400) {
  const fnRef    = useRef(fn);
  const timerRef = useRef(null);

  // Keep fnRef pointing to the latest version so closures are never stale.
  useEffect(() => { fnRef.current = fn; });

  const debounced = useCallback((...args) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]);

  // Cancel on unmount.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return debounced;
}
