import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import type { Sensor } from "../../api/sensors";
import { Link } from "react-router-dom";

function stateVariant(state: Sensor["state"]) {
  if (state === "CRITICAL") return "critical";
  if (state === "WARNING") return "warning";
  if (state === "HEALTHY") return "success";
  return "default";
}

export function SensorCard({ sensor }: { sensor: Sensor }) {
  return (
    <Link to={`/sensors/${sensor.id}`}>
      <Card className="transition hover:border-slate-600">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{sensor.name}</span>
            <Badge variant={stateVariant(sensor.state) as any}>{sensor.state}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-slate-400">ID: {sensor.id}</div>
          <div className="text-xs text-slate-400">Zone: {sensor.zoneId}</div>
          <div className="mt-2 text-xs text-slate-500">
            Last: {sensor.lastReadingAt ? new Date(sensor.lastReadingAt).toLocaleString() : "No data"}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

