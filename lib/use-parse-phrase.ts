"use client"

import * as React from "react"

import type { ParseResponse } from "@/app/api/parse-date/route"

export function useParsePhrase() {
  const [loading, setLoading] = React.useState(false)

  const parse = React.useCallback(
    async (phrase: string): Promise<ParseResponse | null> => {
      const trimmed = phrase.trim()
      if (!trimmed) return null

      setLoading(true)
      try {
        const res = await fetch("/api/parse-date", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phrase: trimmed,
            now: new Date().toISOString(),
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        })
        return (await res.json()) as ParseResponse
      } catch {
        return { ok: false, error: "Couldn't reach the parser, try again." }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { parse, loading }
}

export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}
