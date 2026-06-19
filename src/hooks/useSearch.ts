import { useState, useEffect, useRef } from 'react'
import type { Item } from '../types'
import { searchItems } from '../services/mockApi'
import { useDebounce } from './useDebounce'

export interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: Item[]
  isLoading: boolean
  error: string | null
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * DEBOUNCE — wait for the user to stop typing for 300 ms.
   *
   * `query` updates on every keystroke (controlled input).
   * `debouncedQuery` only updates after 300 ms of inactivity.
   * The fetch effect below depends on `debouncedQuery`, so it only
   * fires once the user pauses — never on every keypress.
   */
  const debouncedQuery = useDebounce(query, 300)

  /**
   * STALE-RESPONSE PREVENTION — monotonic request counter.
   *
   * Problem: user types "re" (request A) then "react" (request B).
   * If A resolves after B, A's stale results would overwrite B's fresh ones.
   *
   * Solution: every new fetch increments this counter and captures its value
   * in a local variable. Before committing any state, we compare the captured
   * value against the current ref. If they don't match, a newer request has
   * already taken ownership — discard silently.
   *
   * useRef (not useState) because changing it must never trigger a re-render.
   */
  const requestIdRef = useRef(0)

  /**
   * UNMOUNT GUARD — tracks whether the component is still alive.
   *
   * Async callbacks complete on their own schedule. By the time a response
   * arrives the component may be unmounted (e.g. user navigated away).
   * Calling setState on an unmounted component is a no-op warning in dev and
   * a potential memory leak. This ref lets every callback bail out early.
   */
  const isMountedRef = useRef(false)

  // Set/clear the mount flag once, independently of the search logic.
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  /**
   * ASYNC SEARCH EFFECT
   *
   * Runs whenever `debouncedQuery` changes (i.e. after the 300 ms debounce
   * window closes). Handles loading state, errors, and stale responses.
   */
  useEffect(() => {
    // Claim a unique ID for this particular fetch invocation.
    const capturedId = ++requestIdRef.current

    const fetchResults = async () => {
      // Safety: component may have unmounted while the debounce timer ran.
      if (!isMountedRef.current) return

      setIsLoading(true)
      setError(null)

      try {
        // mockApi returns all items for '' and filtered items otherwise.
        const data = await searchItems(debouncedQuery)

        /**
         * Stale-response check.
         * If capturedId is no longer the latest ID, a newer request is
         * already in flight or has resolved — throw this result away.
         */
        if (isMountedRef.current && capturedId === requestIdRef.current) {
          setResults(data)
        }
      } catch (err) {
        // Only surface the error if this request is still the active one.
        if (isMountedRef.current && capturedId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Something went wrong')
          setResults([])
        }
      } finally {
        // Always clear loading — but only for the request that owns this cycle.
        if (isMountedRef.current && capturedId === requestIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchResults()

    /**
     * No cleanup needed here: the debounce timer lives inside useDebounce and
     * is already cancelled when debouncedQuery changes. The requestIdRef +
     * isMountedRef guards handle in-flight fetch protection.
     */
  }, [debouncedQuery])

  return { query, setQuery, results, isLoading, error }
}