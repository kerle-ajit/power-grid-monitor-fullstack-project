import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "../../hooks/useAuth";

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="font-semibold">GridWatch</span>
          <nav className="hidden gap-2 md:flex">
            <Link className={`rounded px-3 py-1 text-sm ${isActive("/") ? "bg-slate-800" : "text-slate-300"}`} to="/">Dashboard</Link>
            <Link className={`rounded px-3 py-1 text-sm ${isActive("/alerts") ? "bg-slate-800" : "text-slate-300"}`} to="/alerts">Alerts</Link>
            <Link className={`rounded px-3 py-1 text-sm ${isActive("/suppression") ? "bg-slate-800" : "text-slate-300"}`} to="/suppression">Suppressions</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{user?.role}</span>
          <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
        </div>
      </div>
    </header>
  );
}

