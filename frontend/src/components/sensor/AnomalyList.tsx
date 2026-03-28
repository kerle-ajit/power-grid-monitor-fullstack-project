import type { SensorHistoryRow } from "../../api/sensors";
import { Badge } from "../ui/badge";

export function AnomalyList({ readings }: { readings: SensorHistoryRow[] }) {
  const anomalies = readings.flatMap((r) => r.anomalies.map((a) => ({ ...a, readingTimestamp: r.timestamp })));

  if (anomalies.length === 0) {
    return <div className="text-sm text-slate-400">No anomalies in selected window.</div>;
  }

  return (
    <div className="space-y-2">
      {anomalies.map((a) => (
        <div key={a.anomalyId} className="rounded-md border border-slate-800 p-3 text-sm">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant={a.severity === "CRITICAL" ? "critical" : "warning"}>{a.severity}</Badge>
            <span>{a.type}</span>
            {a.metric ? <span className="text-slate-400">({a.metric})</span> : null}
          </div>
          <div className="text-xs text-slate-400">{new Date(a.readingTimestamp).toLocaleString()}</div>
          <div className="text-xs text-slate-400">Alert: {a.alert?.id ?? "None"}</div>
        </div>
      ))}
    </div>
  );
}

