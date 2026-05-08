"use client"

import * as React from "react"
import { 
  Popover as PopoverPrimitive,
  type PopoverRootProps,
  type PopoverTriggerProps,
  type PopoverPortalProps,
  type PopoverPositionerProps,
  type PopoverPopupProps
} from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function Popover({
  ...props
}: PopoverRootProps) {
  return <PopoverPrimitive.Root {...props} />
}

function PopoverTrigger({
  ...props
}: PopoverTriggerProps) {
  return <PopoverPrimitive.Trigger {...props} />
}

function PopoverPortal({
  ...props
}: PopoverPortalProps) {
  return <PopoverPrimitive.Portal {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: PopoverPositionerProps & PopoverPopupProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner align={align} sideOffset={sideOffset}>
        <PopoverPrimitive.Popup
          className={cn(
            "z-50 w-72 rounded-xl border bg-surface p-4 text-on-surface shadow-md outline-none animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-surface-bright dark:border-outline-variant/10",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverPortal }
