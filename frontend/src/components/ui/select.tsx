import * as React from "react";
import { cn } from "../../lib/utils";

type Option = { value: string; label: string };

export function Select({
  value,
  onValueChange,
  options,
  className
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: Option[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn("h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

