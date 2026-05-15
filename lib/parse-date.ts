import * as chrono from "chrono-node"

import { levenshtein } from "@/lib/levenshtein"

export type ParseHit = {
  start: string
  end: string
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

const KNOWN_MONTH_TOKENS = new Set<string>([
  ...MONTH_NAMES.map((m) => m.toLowerCase()),
  "jan",
  "feb",
  "mar",
  "apr",
  "jun",
  "jul",
  "aug",
  "sep",
  "sept",
  "oct",
  "nov",
  "dec",
])

function correctMonthSpellings(phrase: string): string {
  return phrase.replace(/\b[a-zA-Z]{4,}\b/g, (word) => {
    const lower = word.toLowerCase()
    if (KNOWN_MONTH_TOKENS.has(lower)) return word

    let best: string | null = null
    let bestDistance = Infinity
    for (const month of MONTH_NAMES) {
      const target = month.toLowerCase()
      const d = levenshtein(lower, target)
      const maxAllowed = Math.min(2, Math.max(1, Math.floor(target.length / 4)))
      if (d <= maxAllowed && d < bestDistance) {
        bestDistance = d
        best = month
      }
    }
    return best ?? word
  })
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function toISO(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${pad2(m)}-${pad2(d)}`
}

function getLocalParts(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const lookup = (type: string) =>
    Number(parts.find((p) => p.type === type)!.value)
  return { y: lookup("year"), m: lookup("month"), d: lookup("day") }
}

function getLocalWeekday(date: Date, tz: string): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(date)
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(short)
}

function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + n))
  return toISO(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  )
}

function endOfMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate()
}

function tryRangePhrase(
  phrase: string,
  now: Date,
  tz: string
): ParseHit | null {
  const p = phrase.toLowerCase().trim()
  const { y, m, d } = getLocalParts(now, tz)
  const today = toISO(y, m, d)
  const weekday = getLocalWeekday(now, tz)
  const daysSinceMon = (weekday + 6) % 7
  const monday = addDaysISO(today, -daysSinceMon)

  switch (p) {
    case "today":
      return { start: today, end: today }
    case "tomorrow":
      return { start: addDaysISO(today, 1), end: addDaysISO(today, 1) }
    case "yesterday":
      return { start: addDaysISO(today, -1), end: addDaysISO(today, -1) }
    case "this week":
      return { start: monday, end: addDaysISO(monday, 6) }
    case "next week":
      return { start: addDaysISO(monday, 7), end: addDaysISO(monday, 13) }
    case "last week":
      return { start: addDaysISO(monday, -7), end: addDaysISO(monday, -1) }
    case "this weekend":
      return { start: addDaysISO(monday, 5), end: addDaysISO(monday, 6) }
    case "next weekend":
      return { start: addDaysISO(monday, 12), end: addDaysISO(monday, 13) }
    case "this month":
      return { start: toISO(y, m, 1), end: toISO(y, m, endOfMonth(y, m)) }
    case "next month": {
      const ny = m === 12 ? y + 1 : y
      const nm = m === 12 ? 1 : m + 1
      return { start: toISO(ny, nm, 1), end: toISO(ny, nm, endOfMonth(ny, nm)) }
    }
    case "last month": {
      const ly = m === 1 ? y - 1 : y
      const lm = m === 1 ? 12 : m - 1
      return { start: toISO(ly, lm, 1), end: toISO(ly, lm, endOfMonth(ly, lm)) }
    }
    case "this year":
      return { start: toISO(y, 1, 1), end: toISO(y, 12, 31) }
    case "next year":
      return { start: toISO(y + 1, 1, 1), end: toISO(y + 1, 12, 31) }
    case "last year":
      return { start: toISO(y - 1, 1, 1), end: toISO(y - 1, 12, 31) }
    default:
      return null
  }
}

function componentsToISO(
  comp: chrono.ParsedComponents | null | undefined
): string | null {
  if (!comp) return null
  const y = comp.get("year")
  const m = comp.get("month")
  const d = comp.get("day")
  if (y == null || m == null || d == null) return null
  return toISO(y, m, d)
}

export function tryChrono(
  phrase: string,
  now: Date,
  tz: string
): ParseHit | null {
  const range = tryRangePhrase(phrase, now, tz)
  if (range) return range

  const corrected = correctMonthSpellings(phrase)
  const results = chrono.parse(corrected, now, { forwardDate: true })
  if (results.length === 0) return null

  const first = results[0]
  const start = componentsToISO(first.start)
  if (!start) return null
  const end = componentsToISO(first.end) ?? start
  return { start, end }
}
