import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-900 text-slate-50",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-800",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700",
        outline:
          "text-slate-800 border-slate-300",
        income:
          "border-teal-200 bg-teal-50 text-teal-700",
        expense:
          "border-rose-200 bg-rose-50 text-rose-700",
        ticket:
          "border-indigo-200 bg-indigo-50 text-indigo-700",
        paid:
          "border-teal-200 bg-teal-50 text-teal-700",
        pending:
          "border-amber-200 bg-amber-50 text-amber-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
