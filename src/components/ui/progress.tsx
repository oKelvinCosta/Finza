"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorColor?: string;
  autoSemanticColor?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, indicatorColor, autoSemanticColor = false, ...props }, ref) => {
  let colorClass = indicatorColor || "bg-slate-900";

  if (autoSemanticColor) {
    const val = value ?? 0;
    if (val < 75) {
      colorClass = "bg-teal-500";
    } else if (val <= 100) {
      colorClass = "bg-amber-500";
    } else {
      colorClass = "bg-rose-500";
    }
  }

  const clampedWidth = Math.min(Math.max(value ?? 0, 0), 100);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-100",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all duration-300", colorClass)}
        style={{ transform: `translateX(-${100 - clampedWidth}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
