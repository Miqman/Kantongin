"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-y-4 sm:gap-x-4 sm:gap-y-0",
        month: "space-y-4 relative",
        month_caption: "flex justify-center pt-1 relative items-center h-9",
        caption_label: "text-sm font-semibold text-on-surface",
        nav: "flex items-center justify-between absolute inset-x-0 top-0 h-9 z-10",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 opacity-100 hover:opacity-100 text-on-surface hover:bg-surface-container-high transition-colors"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 opacity-100 hover:opacity-100 text-on-surface hover:bg-surface-container-high transition-colors"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-on-surface-variant/60 rounded-md w-9 font-bold text-[0.7rem] uppercase tracking-wider text-center",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium text-on-surface hover:bg-surface-container-high transition-colors aria-selected:opacity-100"
        ),
        selected:
          "bg-primary text-on-primary hover:bg-primary hover:text-on-primary focus:bg-primary focus:text-on-primary rounded-full",
        today: "bg-primary/10 text-primary font-bold border border-primary/20",
        outside:
          "day-outside text-on-surface-variant opacity-30 aria-selected:bg-surface-container-low/50 aria-selected:text-on-surface-variant aria-selected:opacity-20",
        disabled: "text-on-surface-variant opacity-30",
        range_middle:
          "aria-selected:bg-surface-container-low aria-selected:text-on-surface",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-5 w-5" />
          }
          return <ChevronRight className="h-5 w-5" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
