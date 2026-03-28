import { Link } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="hidden w-56 border-r border-slate-800 bg-slate-950 lg:block">
      <div className="p-3 text-sm text-slate-400">Navigation</div>
      <div className="space-y-1 p-2">
        <Link to="/" className="block rounded px-3 py-2 hover:bg-slate-900">Live Dashboard</Link>
        <Link to="/alerts" className="block rounded px-3 py-2 hover:bg-slate-900">Alerts Panel</Link>
        <Link to="/suppression" className="block rounded px-3 py-2 hover:bg-slate-900">Suppression</Link>
      </div>
    </aside>
  );
}

