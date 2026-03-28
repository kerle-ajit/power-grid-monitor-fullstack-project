import { Badge } from "../ui/badge";

export function SuppressionStatus({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-300">Suppression:</span>
      <Badge variant={active ? "warning" : "success"}>{active ? "ACTIVE" : "INACTIVE"}</Badge>
    </div>
  );
}

