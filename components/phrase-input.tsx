"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { isStrongFuzzyMatch, rankSuggestions } from "@/lib/score-suggestions"

type PhraseInputProps = {
  value: string
  onChange: (value: string) => void
  onCommit: (phrase: string) => void
  suggestions: readonly string[]
  placeholder?: string
  loading?: boolean
  error?: boolean
  listboxId?: string
}

export function PhraseInput({
  value,
  onChange,
  onCommit,
  suggestions: allSuggestions,
  placeholder,
  loading,
  error,
  listboxId = "phrase-listbox",
}: PhraseInputProps) {
  const [open, setOpen] = React.useState(false)
  const [activeIdx, setActiveIdx] = React.useState(-1)
  const blurTimeoutRef = React.useRef<number | undefined>(undefined)

  const ranked = React.useMemo(
    () => rankSuggestions(value, allSuggestions),
    [value, allSuggestions]
  )
  const suggestions = React.useMemo(
    () => ranked.map((r) => r.value),
    [ranked]
  )

  const autoHighlight = isStrongFuzzyMatch(ranked[0], value)
  const effectiveActiveIdx =
    activeIdx === -1 && autoHighlight ? 0 : activeIdx

  const commit = (raw: string) => {
    onChange(raw)
    setOpen(false)
    setActiveIdx(-1)
    onCommit(raw)
  }

  return (
    <div className="relative min-w-[280px]">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const chosen =
            effectiveActiveIdx >= 0
              ? suggestions[effectiveActiveIdx]
              : value
          commit(chosen)
        }}
      >
        <Input
          size={1}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            setActiveIdx(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimeoutRef.current = window.setTimeout(() => {
              setOpen(false)
              onCommit(value)
            }, 120)
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
              setActiveIdx((i) =>
                Math.min(
                  (i === -1 && autoHighlight ? 0 : i) + 1,
                  suggestions.length - 1
                )
              )
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActiveIdx((i) =>
                Math.max((i === -1 && autoHighlight ? 0 : i) - 1, -1)
              )
            } else if (e.key === "Escape") {
              setOpen(false)
              setActiveIdx(-1)
            }
          }}
          disabled={loading}
          aria-invalid={error || undefined}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          role="combobox"
          className="h-11 text-base"
        />
      </form>

      {open && suggestions.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-lg border bg-popover py-1 text-popover-foreground shadow-md"
        >
          {ranked.map((item, i) => (
            <li
              key={item.value}
              role="option"
              aria-selected={i === effectiveActiveIdx}
              onMouseDown={(e) => {
                e.preventDefault()
                window.clearTimeout(blurTimeoutRef.current)
                commit(item.value)
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-sm",
                i === effectiveActiveIdx
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span>{item.value}</span>
              {i === 0 && autoHighlight ? (
                <span className="text-[10px] uppercase tracking-wide opacity-60">
                  did you mean
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
