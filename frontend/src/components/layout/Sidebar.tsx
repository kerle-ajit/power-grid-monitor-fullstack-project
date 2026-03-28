import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const supervisor = user?.role === "SUPERVISOR";
  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const items = [
    { to: "/", label: "Live Dashboard" },
    { to: "/alerts", label: "Alerts Panel" },
    { to: "/suppression", label: "Suppressions" },
    ...(supervisor ? [{ to: "/escalations", label: "Escalations (supervisor)" }] : [])
  ];

  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-800 bg-slate-950 lg:block">
      <div className="p-3 text-sm text-slate-400">Navigation</div>
      <div className="space-y-1 p-2">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`block rounded px-3 py-2 text-sm hover:bg-slate-900 ${isActive(item.to) ? "bg-slate-900 text-white" : "text-slate-300"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
