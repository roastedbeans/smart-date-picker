"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/calendar"
import { PhraseInput } from "@/components/phrase-input"
import { cn } from "@/lib/utils"
import { SINGLE_DATE_SUGGESTIONS } from "@/lib/suggestions"
import { isoToLocalDate, useParsePhrase } from "@/lib/use-parse-phrase"

function formatSingle(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function SingleDatePicker() {
  const [phrase, setPhrase] = React.useState("")
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [error, setError] = React.useState<string | undefined>(undefined)
  const [month, setMonth] = React.useState<Date>(new Date())
  const { parse, loading } = useParsePhrase()
  const lastSubmittedRef = React.useRef<string>("")

  const commit = React.useCallback(
    async (raw: string) => {
      const trimmed = raw.trim()
      if (trimmed === lastSubmittedRef.current) return
      lastSubmittedRef.current = trimmed

      if (!trimmed) {
        setDate(undefined)
        setError(undefined)
        return
      }

      const data = await parse(trimmed)
      if (!data) return
      if (data.ok) {
        const picked = isoToLocalDate(data.start)
        setDate(picked)
        setMonth(picked)
        setError(undefined)
      } else {
        setDate(undefined)
        setError(data.error)
      }
    },
    [parse]
  )

  return (
    <div className="w-fit space-y-3">
      <PhraseInput
        value={phrase}
        onChange={setPhrase}
        onCommit={commit}
        suggestions={SINGLE_DATE_SUGGESTIONS}
        placeholder='Try "tomorrow" or "next Friday"'
        loading={loading}
        error={Boolean(error)}
        listboxId="single-listbox"
      />

      <div className="min-h-5 text-sm">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : date ? (
          <span className="text-muted-foreground">
            Interpreted as{" "}
            <span className="font-medium text-foreground">
              {formatSingle(date)}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground/60">
            Press Enter to parse.
          </span>
        )}
      </div>

      {date ? (
        <div
          className={cn(
            "w-fit rounded-xl border bg-card p-2 shadow-sm",
            loading && "opacity-60"
          )}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={month}
            onMonthChange={setMonth}
            numberOfMonths={1}
          />
        </div>
      ) : null}
    </div>
  )
}
