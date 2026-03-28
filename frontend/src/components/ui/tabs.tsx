import * as React from "react";
import { cn } from "../../lib/utils";

type TabsContextType = { value: string; setValue: (v: string) => void };
const TabsContext = React.createContext<TabsContextType | null>(null);

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = value ?? internal;
  const setValue = onValueChange ?? setInternal;
  return <TabsContext.Provider value={{ value: current, setValue }}>{children}</TabsContext.Provider>;
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex rounded-md bg-slate-800 p-1", className)} {...props} />;
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) return null;
  const active = ctx.value === value;
  return (
    <button className={cn("rounded px-3 py-1.5 text-sm", active ? "bg-slate-700 text-white" : "text-slate-300", className)} onClick={() => ctx.setValue(value)}>
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx || ctx.value !== value) return null;
  return <div className="mt-3">{children}</div>;
}

