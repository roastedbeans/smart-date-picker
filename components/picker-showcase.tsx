"use client"

import * as React from "react"

import { SmartDatePicker } from "@/components/smart-date-picker"
import { cn } from "@/lib/utils"

const MODES = [
  { id: "single", label: "Single date" },
  { id: "range", label: "Range" },
  { id: "split", label: "Range (split)" },
] as const

type Mode = (typeof MODES)[number]["id"]

export function PickerShowcase() {
  const [mode, setMode] = React.useState<Mode>("range")

  return (
    <section className="space-y-6">
      <div
        role="tablist"
        aria-label="Picker mode"
        className="inline-flex rounded-lg border border-border bg-card p-1"
      >
        {MODES.map((m) => {
          const active = mode === m.id
          return (
            <button
              key={m.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setMode(m.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          )
        })}
      </div>

      <div>
        {mode === "single" ? <SmartDatePicker key="single" /> : null}
        {mode === "range" ? <SmartDatePicker key="range" range /> : null}
        {mode === "split" ? (
          <SmartDatePicker key="split" range separate />
        ) : null}
      </div>
    </section>
  )
}
