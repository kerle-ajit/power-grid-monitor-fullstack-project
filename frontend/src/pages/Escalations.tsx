import { useEffect, useState } from "react";
import { getEscalations, type EscalationRow } from "../api/escalations";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Loader } from "../components/common/Loader";

export default function EscalationsPage() {
  const [rows, setRows] = useState<EscalationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEscalations()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading escalations..." />;

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Escalation Log</h1>
      <p className="text-sm text-slate-400">Critical alerts escalated to supervisors (supervisor-only view).</p>

      <Card>
        <CardHeader>
          <CardTitle>Recent escalations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escalated</TableHead>
                  <TableHead>Alert</TableHead>
                  <TableHead>Sensor</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.escalatedAt).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{r.alertId}</TableCell>
                    <TableCell>{r.alert?.sensorId ?? "—"}</TableCell>
                    <TableCell>{r.alert?.zoneId ?? "—"}</TableCell>
                    <TableCell>{r.alert?.severity ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
