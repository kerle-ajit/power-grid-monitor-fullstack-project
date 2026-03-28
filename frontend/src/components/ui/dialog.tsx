import * as React from "react";
import { cn } from "../../lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => onOpenChange(false)}>
      <div className={cn("w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-4")} onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="text-slate-300" onClick={() => onOpenChange(false)}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

