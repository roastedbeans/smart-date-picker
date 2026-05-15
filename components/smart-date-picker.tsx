"use client"

import { RangeDatePicker } from "@/components/range-date-picker"
import { SingleDatePicker } from "@/components/single-date-picker"

export type SmartDatePickerProps = {
  range?: boolean
  separate?: boolean
}

export function SmartDatePicker({
  range = false,
  separate = false,
}: SmartDatePickerProps) {
  if (range) return <RangeDatePicker separate={separate} />
  return <SingleDatePicker />
}
