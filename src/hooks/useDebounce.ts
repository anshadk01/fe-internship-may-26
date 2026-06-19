import { useState, useEffect } from 'react'

/**
 * useDebounce
 *
 * Returns a "settled" copy of `value` that only updates after the user has
 * stopped changing it for `delay` milliseconds.
 *
 * How it works:
 *   Every time `value` changes, React runs the effect cleanup first
 *   (clearTimeout) and then starts a fresh timer. If `value` stabilises for
 *   `delay` ms the timer fires and `debounced` is updated. If `value` changes
 *   again before the timer fires the old timer is cancelled — so `debounced`
 *   never reflects intermediate values.
 *
 * Generic <T> so it works with strings, numbers, objects, etc.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebounced(value)
    }, delay)

    // Cleanup: cancel the timer if value changes before delay expires
    return () => clearTimeout(timerId)
  }, [value, delay])

  return debounced
}