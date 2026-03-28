import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../hooks/useAuth";

const nav = (supervisor: boolean) =>
  [
    { to: "/", label: "Dashboard" },
    { to: "/alerts", label: "Alerts" },
    { to: "/suppression", label: "Suppressions" },
    ...(supervisor ? [{ to: "/escalations", label: "Escalations" }] : [])
  ] as const;

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
  const links = nav(user?.role === "SUPERVISOR");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <span className="truncate font-semibold">GridWatch</span>
          <nav className="hidden min-w-0 gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                className={`shrink-0 rounded px-3 py-1 text-sm ${isActive(l.to) ? "bg-slate-800 text-white" : "text-slate-300"}`}
                to={l.to}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-slate-400 sm:inline">{user?.role}</span>
          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/70" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-r border-slate-800 bg-slate-950 p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">Menu</span>
              <Button type="button" variant="outline" size="sm" aria-label="Close" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  className={`rounded px-3 py-2 text-sm ${isActive(l.to) ? "bg-slate-800" : "text-slate-300"}`}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-slate-800 pt-4 text-xs text-slate-500">{user?.role}</div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
