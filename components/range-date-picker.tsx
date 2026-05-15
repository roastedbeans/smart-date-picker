"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"
import { PhraseInput } from "@/components/phrase-input"
import { cn } from "@/lib/utils"
import {
  RANGE_SUGGESTIONS,
  SINGLE_DATE_SUGGESTIONS,
} from "@/lib/suggestions"
import { isoToLocalDate, useParsePhrase } from "@/lib/use-parse-phrase"

export type RangeDatePickerProps = {
  separate?: boolean
}

function formatRange(range: DateRange): string {
  const fmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  if (!range.to || range.from?.getTime() === range.to.getTime()) {
    return fmt.format(range.from)
  }
  const fmtNoYear = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  })
  const sameYear = range.from?.getFullYear() === range.to.getFullYear()
  const left = sameYear ? fmtNoYear.format(range.from) : fmt.format(range.from)
  return `${left} – ${fmt.format(range.to)}`
}

function todayAtMidnight(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function RangeDatePicker({ separate = false }: RangeDatePickerProps) {
  return separate ? <TwoInputRangePicker /> : <OneInputRangePicker />
}

function OneInputRangePicker() {
  const [phrase, setPhrase] = React.useState("")
  const [range, setRange] = React.useState<DateRange | undefined>(undefined)
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
        setRange(undefined)
        setError(undefined)
        return
      }

      const data = await parse(trimmed)
      if (!data) return
      if (data.ok) {
        let from = isoToLocalDate(data.start)
        const to = isoToLocalDate(data.end)
        const today = todayAtMidnight()
        if (
          from.getTime() === to.getTime() &&
          to.getTime() >= today.getTime()
        ) {
          from = today
        }
        setRange({ from, to })
        setMonth(from)
        setError(undefined)
      } else {
        setRange(undefined)
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
        suggestions={RANGE_SUGGESTIONS}
        placeholder='Try "next week" or "this month"'
        loading={loading}
        error={Boolean(error)}
        listboxId="range-listbox"
      />

      <InterpretedLine error={error} value={range && formatRange(range)} />

      {range?.from ? (
        <CalendarCard loading={loading}>
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            month={month}
            onMonthChange={setMonth}
            numberOfMonths={2}
          />
        </CalendarCard>
      ) : null}
    </div>
  )
}

function TwoInputRangePicker() {
  const [fromPhrase, setFromPhrase] = React.useState("")
  const [toPhrase, setToPhrase] = React.useState("")
  const [fromDate, setFromDate] = React.useState<Date | undefined>(undefined)
  const [toDate, setToDate] = React.useState<Date | undefined>(undefined)
  const [fromError, setFromError] = React.useState<string | undefined>(undefined)
  const [toError, setToError] = React.useState<string | undefined>(undefined)
  const [month, setMonth] = React.useState<Date>(new Date())
  const { parse, loading } = useParsePhrase()
  const lastFromRef = React.useRef<string>("")
  const lastToRef = React.useRef<string>("")

  const commitSide = async (
    raw: string,
    side: "from" | "to"
  ): Promise<void> => {
    const trimmed = raw.trim()
    const lastRef = side === "from" ? lastFromRef : lastToRef
    if (trimmed === lastRef.current) return
    lastRef.current = trimmed

    const setDate = side === "from" ? setFromDate : setToDate
    const setErr = side === "from" ? setFromError : setToError

    if (!trimmed) {
      setDate(undefined)
      setErr(undefined)
      return
    }

    const data = await parse(trimmed)
    if (!data) return
    if (data.ok) {
      const picked = isoToLocalDate(side === "from" ? data.start : data.end)
      setDate(picked)
      setMonth(picked)
      setErr(undefined)
    } else {
      setDate(undefined)
      setErr(data.error)
    }
  }

  const range: DateRange | undefined = React.useMemo(() => {
    if (fromDate && toDate) {
      return fromDate.getTime() <= toDate.getTime()
        ? { from: fromDate, to: toDate }
        : { from: toDate, to: fromDate }
    }
    if (fromDate) return { from: fromDate, to: fromDate }
    if (toDate) return { from: toDate, to: toDate }
    return undefined
  }, [fromDate, toDate])

  const combinedError = fromError ?? toError

  return (
    <div className="w-fit space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <div className="flex-1">
          <PhraseInput
            value={fromPhrase}
            onChange={setFromPhrase}
            onCommit={(raw) => commitSide(raw, "from")}
            suggestions={SINGLE_DATE_SUGGESTIONS}
            placeholder="From"
            loading={loading}
            error={Boolean(fromError)}
            listboxId="range-from-listbox"
          />
        </div>
        <div className="hidden self-center text-muted-foreground md:block">
          →
        </div>
        <div className="flex-1">
          <PhraseInput
            value={toPhrase}
            onChange={setToPhrase}
            onCommit={(raw) => commitSide(raw, "to")}
            suggestions={SINGLE_DATE_SUGGESTIONS}
            placeholder="To"
            loading={loading}
            error={Boolean(toError)}
            listboxId="range-to-listbox"
          />
        </div>
      </div>

      <InterpretedLine
        error={combinedError}
        value={range && formatRange(range)}
      />

      {range?.from ? (
        <CalendarCard loading={loading}>
          <Calendar
            mode="range"
            selected={range}
            month={month}
            onMonthChange={setMonth}
            numberOfMonths={2}
          />
        </CalendarCard>
      ) : null}
    </div>
  )
}

function InterpretedLine({
  error,
  value,
}: {
  error?: string
  value?: string
}) {
  return (
    <div className="min-h-5 text-sm">
      {error ? (
        <span className="text-destructive">{error}</span>
      ) : value ? (
        <span className="text-muted-foreground">
          Interpreted as{" "}
          <span className="font-medium text-foreground">{value}</span>
        </span>
      ) : (
        <span className="text-muted-foreground/60">Press Enter to parse.</span>
      )}
    </div>
  )
}

function CalendarCard({
  children,
  loading,
}: {
  children: React.ReactNode
  loading?: boolean
}) {
  return (
    <div
      className={cn(
        "w-fit rounded-xl border bg-card p-2 shadow-sm",
        loading && "opacity-60"
      )}
    >
      {children}
    </div>
  )
}
