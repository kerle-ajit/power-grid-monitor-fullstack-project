import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { AlertItem } from "../../api/alerts";

export function AlertRow({
  alert,
  onAck,
  onResolve
}: {
  alert: AlertItem;
  onAck: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  return (
    <tr className="border-t border-slate-800">
      <td className="px-2 py-2">{alert.alertId.slice(0, 8)}</td>
      <td className="px-2 py-2">{alert.sensorId}</td>
      <td className="px-2 py-2">
        <Badge variant={alert.severity === "CRITICAL" ? "critical" : "warning"}>{alert.severity}</Badge>
      </td>
      <td className="px-2 py-2">{alert.status}</td>
      <td className="px-2 py-2">{alert.zoneId}</td>
      <td className="px-2 py-2">
        <div className="flex gap-2">
          {alert.status === "OPEN" ? <Button size="sm" variant="secondary" onClick={() => onAck(alert.alertId)}>Ack</Button> : null}
          {alert.status !== "RESOLVED" ? <Button size="sm" onClick={() => onResolve(alert.alertId)}>Resolve</Button> : null}
        </div>
      </td>
    </tr>
  );
}

