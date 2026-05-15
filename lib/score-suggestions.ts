import { levenshtein } from "@/lib/levenshtein"

export type ScoredSuggestion = {
  value: string
  score: number
}

export function scoreSuggestion(query: string, suggestion: string): number {
  const q = query.trim().toLowerCase()
  const s = suggestion.toLowerCase()
  if (!q) return 1
  if (s === q) return 1000
  if (s.startsWith(q)) return 900 - (s.length - q.length)

  const idx = s.indexOf(q)
  if (idx >= 0) return 700 - idx * 5

  if (q.length >= 3) {
    const words = s.split(/\s+/)
    let bestWordDist = Infinity
    for (const w of words) {
      const d = levenshtein(q, w)
      if (d < bestWordDist) bestWordDist = d
    }
    if (bestWordDist <= 2) return 500 - bestWordDist * 100
  }

  if (q.length >= 4 && s.length >= 4) {
    const d = levenshtein(q, s)
    const maxAllowed = Math.max(2, Math.floor(s.length / 3))
    if (d <= maxAllowed) return 200 - d * 20
  }

  return 0
}

export function rankSuggestions(
  query: string,
  all: readonly string[]
): ScoredSuggestion[] {
  return all
    .map((value) => ({ value, score: scoreSuggestion(query, value) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function isStrongFuzzyMatch(
  top: ScoredSuggestion | undefined,
  query: string
): boolean {
  if (!top) return false
  if (top.score === 1000) return false
  if (top.score >= 900) return query.trim().length >= 4
  return top.score >= 200
}
