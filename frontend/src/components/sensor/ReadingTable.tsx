import type { SensorHistoryRow } from "../../api/sensors";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

export function ReadingTable({ readings }: { readings: SensorHistoryRow[] }) {
  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Voltage</TableHead>
            <TableHead>Current</TableHead>
            <TableHead>Temperature</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Triggered</TableHead>
            <TableHead>Anomalies</TableHead>
            <TableHead>Alert refs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {readings.map((r) => (
            <TableRow key={r.readingId}>
              <TableCell>{new Date(r.timestamp).toLocaleString()}</TableCell>
              <TableCell>{r.voltage.toFixed(2)}</TableCell>
              <TableCell>{r.current.toFixed(2)}</TableCell>
              <TableCell>{r.temperature.toFixed(2)}</TableCell>
              <TableCell>{r.statusCode}</TableCell>
              <TableCell>{r.triggered ? "Yes" : "No"}</TableCell>
              <TableCell>{r.anomalies.length}</TableCell>
              <TableCell className="max-w-[12rem] truncate font-mono text-xs text-slate-400">
                {r.anomalies
                  .map((a) => a.alert?.id)
                  .filter(Boolean)
                  .join(", ") || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

