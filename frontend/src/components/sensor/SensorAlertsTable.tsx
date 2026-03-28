import { useEffect, useState } from "react";
import { acknowledgeAlert, getAlerts, resolveAlert, type AlertItem } from "../../api/alerts";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "../ui/table";
import { AlertRow } from "../alerts/AlertRow";
import { Loader } from "../common/Loader";

export function SensorAlertsTable({ sensorId }: { sensorId: string }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!sensorId) return;
    setLoading(true);
    try {
      const res = await getAlerts({
        sensorId,
        page: 1,
        pageSize: 100,
        includeSuppressed: true
      });
      setAlerts(res.alerts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!sensorId) return;
    void load();
  }, [sensorId]);

  async function onAck(id: string) {
    await acknowledgeAlert(id);
    await load();
  }
  async function onResolve(id: string) {
    await resolveAlert(id);
    await load();
  }

  if (loading) return <Loader label="Loading alerts..." />;

  if (alerts.length === 0) {
    return <div className="text-sm text-slate-400">No alerts for this sensor.</div>;
  }

  return (
    <div className="overflow-auto rounded-xl border border-slate-800">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Sensor</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((a) => (
            <AlertRow key={a.alertId} alert={a} onAck={onAck} onResolve={onResolve} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
