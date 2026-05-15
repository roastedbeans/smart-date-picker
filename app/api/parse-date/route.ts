import { NextResponse } from "next/server"

import { tryChrono, type ParseHit } from "@/lib/parse-date"

export type ParseResponse =
  | { ok: true; start: string; end: string }
  | { ok: false; error: string }

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidHit(hit: ParseHit | null): hit is ParseHit {
  if (!hit) return false
  if (!ISO_DATE_RE.test(hit.start) || !ISO_DATE_RE.test(hit.end)) return false
  const startMs = Date.parse(`${hit.start}T00:00:00Z`)
  const endMs = Date.parse(`${hit.end}T00:00:00Z`)
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return false
  return endMs >= startMs
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ParseResponse>(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  const { phrase, now, tz } = (body ?? {}) as {
    phrase?: unknown
    now?: unknown
    tz?: unknown
  }

  if (
    typeof phrase !== "string" ||
    typeof now !== "string" ||
    typeof tz !== "string"
  ) {
    return NextResponse.json<ParseResponse>(
      { ok: false, error: "Missing phrase, now, or tz" },
      { status: 400 }
    )
  }

  const trimmed = phrase.trim()
  if (!trimmed) {
    return NextResponse.json<ParseResponse>(
      { ok: false, error: "Empty phrase" },
      { status: 400 }
    )
  }

  const nowDate = new Date(now)
  if (Number.isNaN(nowDate.getTime())) {
    return NextResponse.json<ParseResponse>(
      { ok: false, error: "Invalid 'now' timestamp" },
      { status: 400 }
    )
  }

  const hit = tryChrono(trimmed, nowDate, tz)
  if (isValidHit(hit)) {
    return NextResponse.json<ParseResponse>({
      ok: true,
      start: hit.start,
      end: hit.end,
    })
  }

  return NextResponse.json<ParseResponse>({
    ok: false,
    error: `Couldn't understand "${trimmed}"`,
  })
}
