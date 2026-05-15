"use client"

import * as React from "react"
import { ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: string
  disabled?: boolean
}

type ComboboxProps = {
  options: ComboboxOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

function Combobox({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select an option…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results found.",
  disabled,
  className,
}: ComboboxProps) {
  const isControlled = value !== undefined
  const [internal, setInternal] = React.useState<string>(defaultValue ?? "")
  const [open, setOpen] = React.useState(false)
  const selected = isControlled ? value : internal

  const selectedLabel = options.find((o) => o.value === selected)?.label

  const handleSelect = (nextValue: string) => {
    const next = nextValue === selected ? "" : nextValue
    if (!isControlled) setInternal(next)
    onValueChange?.(next)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            aria-expanded={open}
            className={cn(
              "w-[240px] justify-between font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          >
            {selectedLabel ?? placeholder}
            <ChevronsUpDownIcon
              data-icon="inline-end"
              className="opacity-50"
            />
          </Button>
        }
      />
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  disabled={option.disabled}
                  data-checked={option.value === selected}
                  onSelect={() => handleSelect(option.value)}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }
