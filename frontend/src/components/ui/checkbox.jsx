import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
  return (
    <button
      type="button"
      ref={ref}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white",
        checked && "bg-blue-600 border-blue-600 text-white",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
      data-state={checked ? "checked" : "unchecked"}
      {...props}
    >
      {checked && (
        <Check className="h-3 w-3" />
      )}
    </button>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
