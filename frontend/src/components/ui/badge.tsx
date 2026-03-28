import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva("inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-slate-700 text-slate-100",
      warning: "bg-amber-600/20 text-amber-400 border border-amber-600/30",
      critical: "bg-red-600/20 text-red-400 border border-red-600/30",
      success: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
    }
  },
  defaultVariants: { variant: "default" }
});

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

