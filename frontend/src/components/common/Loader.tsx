export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-slate-300">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
      <span className="ml-2 text-sm">{label}</span>
    </div>
  );
}

