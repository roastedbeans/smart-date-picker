"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
  value?: Date
  defaultValue?: Date
  onValueChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function DatePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerProps) {
  const isControlled = value !== undefined
  const [internal, setInternal] = React.useState<Date | undefined>(defaultValue)
  const selected = isControlled ? value : internal

  const handleSelect = (date: Date | undefined) => {
    if (!isControlled) setInternal(date)
    onValueChange?.(date)
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-[240px] justify-start font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            {selected ? formatDate(selected) : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
