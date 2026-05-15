# Smart Date Picker — Natural-Language React Date & Range Picker

A React date picker and date range picker that you control by **typing**. Type **"next Friday"**, **"this month"**, or even **"Janury 15"** (with a typo) and the calendar follows. Built on [chrono-node](https://github.com/wanasit/chrono) + a rule-based range parser. **No LLM, no API key, no network calls** — fully deterministic and offline.

> _Stop clicking through 12 months of arrows. Just type what you mean._

![Smart date picker demo](public/next.svg)

## Why this exists

Most date pickers force users to navigate a grid of cells. Power users (analysts, schedulers, anyone who knows roughly the date they want) end up clicking next-month-next-month-next-month. A natural-language input is faster for them — but every "smart" date picker on npm either pulls in a 100MB LLM dependency, calls a paid API, or breaks on typos. This project ships a small, deterministic alternative built from `chrono-node` plus a tiny custom rule layer.

## Features

- **Three picker modes from one component:** single date, range with one input, or range with split `from` / `to` inputs.
- **Natural-language parsing.** Understands relative dates (`tomorrow`, `in 3 days`, `2 weeks ago`), weekdays (`next Monday`, `last Friday`), ranges (`this week`, `next month`, `last year`), and absolute dates (`May 20`, `January 1, 2027`).
- **Typo correction.** `Janury 15` resolves to `January 15` automatically — a Levenshtein-distance pass over month names.
- **Autosuggest dropdown.** Ranks suggestions by relevance; surfaces a "did you mean" hint when your input fuzzy-matches a known phrase.
- **Keyboard-first.** `↑` / `↓` to navigate suggestions, `Enter` to commit, `Esc` to dismiss.
- **Range expansion.** When you type a single future date into the range picker (e.g. `June`), it expands to "today through that date" automatically.
- **Zero dependencies on AI.** No LLM, no Anthropic / OpenAI key required. The entire parser is ~250 lines of TypeScript.
- **Accessible.** Combobox pattern with proper ARIA roles (`role="combobox"`, `role="listbox"`, `aria-selected`, etc.).

## Live demo

Run locally:

```bash
git clone https://github.com/roastedbeans/smart-date-picker.git
cd smart-date-picker
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** (base-nova preset, Base UI primitives)
- **chrono-node** for NLP date parsing
- **react-day-picker** for the calendar widget

## Usage

```tsx
import { SmartDatePicker } from "@/components/smart-date-picker"

export default function Example() {
  return (
    <>
      <SmartDatePicker />                  {/* Single date */}
      <SmartDatePicker range />            {/* Range, one input */}
      <SmartDatePicker range separate />   {/* Range, separate from/to */}
    </>
  )
}
```

Each picker is uncontrolled by default and accepts an `onValueChange` callback:

```tsx
<SmartDatePicker
  onValueChange={(date) => console.log("picked:", date)}
/>
```

## Supported phrases

The deterministic parser handles all of these out of the box. Anything chrono-node understands works, plus the rule-based range phrases below.

### Single-date phrases

| Phrase | Resolves to |
|--------|-------------|
| `today` / `tomorrow` / `yesterday` | Anchor day |
| `Monday`, `next Friday`, `last Wednesday` | The closest matching weekday |
| `in 3 days`, `in 2 weeks`, `in a month` | Today + offset |
| `2 days ago`, `a week ago`, `a year ago` | Today − offset |
| `May 20`, `December 25`, `January 1, 2027` | Absolute date |
| `Janury 15`, `Feburary 20`, `Decmber 25` | Auto-corrected absolute date |

### Range phrases

| Phrase | Resolves to |
|--------|-------------|
| `this week` / `next week` / `last week` | Monday–Sunday of the relevant week |
| `this weekend` / `next weekend` | Saturday–Sunday |
| `this month` / `next month` / `last month` | First–last day of the month |
| `this year` / `next year` / `last year` | January 1 – December 31 |

In **range mode**, typing a single future date (e.g. `June`, `Christmas`, `next Friday`) expands to a range that starts **today** and ends on the parsed date — a common "from now until X" pattern.

## Project structure

```
app/                            Next.js demo pages
  page.tsx                      Landing page
  layout.tsx
  globals.css
components/
  smart-date-picker.tsx         Dispatcher: range? separate?
  single-date-picker.tsx        Single-date picker
  range-date-picker.tsx         Range picker (1-input + 2-input variants)
  phrase-input.tsx              Combobox input with autosuggest
  picker-showcase.tsx           Demo mode toggle (landing page)
  ui/                           shadcn primitives
lib/
  parse-date.ts                 Rule-based + chrono parser
  score-suggestions.ts          Levenshtein-based suggestion scoring
  levenshtein.ts
  suggestions.ts                Curated phrase lists
  use-parse-phrase.ts           Client-side parsing hook
  utils.ts                      cn() helper
docs/
  superpowers/specs/            Design docs
```

## How parsing works

```
                ┌──────────────────────┐
"next week" ──▶ │ tryRangePhrase()     │ ── rule match ──▶ { 2026-05-18, 2026-05-24 }
                └──────────────────────┘
                          │ no match
                          ▼
                ┌──────────────────────┐
                │ correctMonthSpelling │  ("Janury" → "January")
                └──────────────────────┘
                          │
                          ▼
                ┌──────────────────────┐
                │ chrono.parse()       │ ── result ──▶ { start: "2027-01-15", end: "2027-01-15" }
                └──────────────────────┘
                          │ no result
                          ▼
                        null (UI shows "Couldn't understand …")
```

The whole pipeline is synchronous and runs in the browser. No backend round-trip.

## Customization

This repo is structured as a Next.js demo, not yet published to npm. To adapt the pickers for your own project:

1. Copy `components/smart-date-picker.tsx`, `single-date-picker.tsx`, `range-date-picker.tsx`, and `phrase-input.tsx` into your project.
2. Copy `lib/parse-date.ts`, `levenshtein.ts`, `score-suggestions.ts`, `suggestions.ts`, and `use-parse-phrase.ts`.
3. The components depend on shadcn/ui primitives (`Input`, `Calendar`, `Popover`, etc.). Either run `npx shadcn@latest add input calendar popover command button` or swap in your own equivalents.
4. Override the suggestion lists in `lib/suggestions.ts` to fit your locale or use case.

## Keywords

React date picker · natural language date picker · date range picker · React calendar · chrono-node React · typo-tolerant date input · combobox date picker · shadcn date picker · Next.js date picker · accessible date picker · offline date picker · no-LLM date parser.

## License

MIT. See [LICENSE](LICENSE) if present, otherwise treat as MIT-licensed.

## Contributing

Issues and PRs welcome at [github.com/roastedbeans/smart-date-picker](https://github.com/roastedbeans/smart-date-picker).
