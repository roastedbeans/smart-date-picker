# Natural-Language Date Picker — Design

**Status:** Approved for v1 implementation
**Date:** 2026-05-15
**Project:** date-picker-ai

## Goal

A date picker where the user types a phrase in plain English ("next week", "in 3 days", "Memorial Day") and the calendar updates to show the corresponding date or date range. The picker auto-detects whether the phrase resolves to a single date or a range — a single date is just a range where `start === end`.

The product target is **simple to use**: one input, one always-visible calendar, one line of feedback telling the user how their phrase was interpreted.

## Non-goals (v1)

- Suggestion chips, recent-phrases history, "Copy ISO" buttons — deferred to a possible v2.
- LLM-generated explanations of *why* a phrase was interpreted a certain way — deferred.
- Multi-locale parsing. v1 is English / US-style dates only.
- Automated test suite. v1 ships with a documented manual smoke-test list.

## Architecture

A single Next.js App Router page renders one client component. Parsing happens in a server route so the LLM API key never reaches the browser.

```
Browser                                 Server
┌────────────────────────┐              ┌──────────────────────────┐
│ SmartDatePicker        │  POST        │ /api/parse-date          │
│  ─ <Input>             │ ───────────▶ │   1. tryChrono(...)      │
│  ─ "Interpreted as: …" │              │   2. if miss → tryLLM    │
│  ─ <Calendar range>    │ ◀─────────── │   3. validate + return   │
└────────────────────────┘   { start,   └──────────────────────────┘
                               end,
                               source }
```

### Trigger

Parsing runs on **Enter** (input submit) or **blur**. Not per-keystroke. The LLM fallback can take 500–2000ms, which is fine for a deliberate action but unacceptable per keystroke.

### Request / response contract

**Request** (POST `/api/parse-date`):
```ts
{
  phrase: string;
  now: string;   // ISO timestamp from the client (e.g. new Date().toISOString())
  tz: string;    // IANA zone, from Intl.DateTimeFormat().resolvedOptions().timeZone
}
```

`now` + `tz` together let the server anchor chrono and format date-only strings in the user's local wall-clock, regardless of where the server runs. The server uses `Intl.DateTimeFormat("en-CA", { timeZone: tz })` (which yields `YYYY-MM-DD`) to format outputs.

**Response:**
```ts
type ParseResult =
  | { ok: true; start: string /* YYYY-MM-DD */; end: string /* YYYY-MM-DD */; source: "chrono" | "llm" }
  | { ok: false; error: string }
```

Dates are date-only strings (`YYYY-MM-DD`), not timestamps. A single-day result has `start === end`.

### Parser pipeline (server)

1. **`tryChrono(phrase, now, tz)`** — calls `chrono.parse(phrase, new Date(now))`. If chrono returns at least one result, extract `start` and `end`:
   - If the result has both `start` and `end`, use both.
   - If only `start`, set `end = start`.
   - Format both as `YYYY-MM-DD` via `Intl.DateTimeFormat("en-CA", { timeZone: tz })`.
2. **`tryLLM(phrase, now, tz)`** — only runs on chrono miss. Calls Claude Haiku with a system prompt that instructs the model to return strict JSON of shape `{ start: "YYYY-MM-DD", end: "YYYY-MM-DD" } | { error: string }`. Uses tool-use for reliable structured output. The prompt includes today's date (computed from `now`+`tz`) as the reference.
3. **Validation** — server checks both `start` and `end` match `/^\d{4}-\d{2}-\d{2}$/`, parse cleanly, and `end >= start`. Invalid → treat as miss.
4. **Both miss** → return `{ ok: false, error: "Couldn't understand 'phrase'" }`.

## File layout

### New files
| Path | Purpose |
|---|---|
| `app/api/parse-date/route.ts` | POST handler, orchestrates chrono → LLM → validation. |
| `lib/parse-date.ts` | `tryChrono(phrase, now)` — pure, no I/O, no imports beyond `chrono-node`. |
| `lib/llm-parse-date.ts` | `tryLLM(phrase, now)` — server-only, imports `@anthropic-ai/sdk`. |
| `components/smart-date-picker.tsx` | Client component: input, interpreted line, range calendar. |
| `.env.example` | Documents `ANTHROPIC_API_KEY`. |

### Modified
| Path | Change |
|---|---|
| `app/page.tsx` | Replace the shadcn demo with `<SmartDatePicker />` centered on the page. |
| `package.json` | Add `chrono-node`, `@anthropic-ai/sdk` dependencies. |

### Reused as-is
- `components/ui/input.tsx`
- `components/ui/calendar.tsx` (used in `mode="range"`)
- `components/ui/button.tsx`

The earlier `components/ui/date-picker.tsx` and `components/ui/combobox.tsx` stay in the library — just no longer rendered on `/`.

## UI layout

```
┌─────────────────────────────────────────┐
│  e.g. "next week"                       │
└─────────────────────────────────────────┘
   Interpreted as: May 19 – May 25, 2026

      May 2026
      Mo Tu We Th Fr Sa Su
                   1  2  3
       4  5  6  7  8  9 10
      11 12 13 14 15 16 17
      18[19 20 21 22 23 24
      25]26 27 28 29 30 31
```

- Input is the primary focus, large.
- "Interpreted as:" line shows the parsed range in a friendly format (`May 19 – May 25, 2026`, or `May 25, 2026` for a single day).
- Calendar is always visible, in `mode="range"`, with the resolved start/end highlighted.
- On a new successful parse, the calendar's displayed month jumps to `start`'s month.

## State (client)

```ts
type State = {
  phrase: string;          // the input value
  range?: { start: Date; end: Date };  // last successful parse
  source?: "chrono" | "llm";           // shown subtly next to interpreted line
  error?: string;          // shown under input on miss / network error
  loading: boolean;        // disables input during in-flight request
}
```

`useState` is enough. No external store.

## Error handling

| Condition | UI |
|---|---|
| Empty phrase on Enter | Clear range, no error shown. |
| Both parsers miss | "Couldn't understand 'next squorp'" under input; calendar clears. |
| Network / server error | "Couldn't reach the parser, try again." |
| Missing `ANTHROPIC_API_KEY` | Server returns 500 with a message; UI shows "Date parsing unavailable." Chrono path still works. |
| LLM returns malformed JSON or invalid date | Server treats as miss → standard miss UX. |
| `end < start` (LLM mistake) | Server treats as invalid → miss. |

## Manual smoke-test phrase list

Each of these must produce the expected behavior before merge:

| Phrase | Expected | Path |
|---|---|---|
| `tomorrow` | single day = today + 1 | chrono |
| `next week` | Mon–Sun of upcoming week | chrono |
| `in 3 days` | single day = today + 3 | chrono |
| `this month` | full month | chrono |
| `May 20` | single day, current year | chrono |
| `Memorial Day` | last Monday of May, current year | llm |
| `Q3 2026` | Jul 1 – Sep 30, 2026 | llm |
| `asdfgh` | error: "Couldn't understand 'asdfgh'" | both miss |
| empty | no request, no error | client-side guard |

## Dependencies & env

**New runtime deps:**
- `chrono-node` (~50 KB gzipped, no transitive heavyweights)
- `@anthropic-ai/sdk`

**Env vars:**
- `ANTHROPIC_API_KEY` (required for LLM fallback; chrono path works without it)

**Model:** `claude-haiku-4-5-20251001` — fast, cheap, sufficient for this structured output.

## Follow-ups (out of scope for v1)

- Suggestion chips ("try: this week / next month / in 3 days")
- Recent-phrases history
- LLM explanation line ("interpreted as the 7 days starting Mon May 18 because…")
- Locale / timezone selection UI
- Automated test suite (Vitest + fixture table for `tryChrono`, mocked Anthropic for the route)
- Copy-as-ISO button
