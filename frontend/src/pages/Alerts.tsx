import { useEffect, useState } from "react";
import { acknowledgeAlert, getAlerts, resolveAlert, type AlertItem } from "../api/alerts";
import { Select } from "../components/ui/select";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { AlertRow } from "../components/alerts/AlertRow";
import { useSocket } from "../hooks/useSocket";
import { Loader } from "../components/common/Loader";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await getAlerts({
        status: status === "ALL" ? undefined : status,
        page: 1,
        pageSize: 100
      });
      setAlerts(res.alerts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status]);

  useSocket({
    onAlertCreated: () => void load(),
    onAlertUpdated: () => void load(),
    onEscalationEvent: () => void load()
  });

  async function onAck(id: string) {
    await acknowledgeAlert(id);
    await load();
  }
  async function onResolve(id: string) {
    await resolveAlert(id);
    await load();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Alerts Panel</h1>
        <Select
          value={status}
          onValueChange={setStatus}
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "OPEN", label: "Open" },
            { value: "ACKNOWLEDGED", label: "Acknowledged" },
            { value: "RESOLVED", label: "Resolved" }
          ]}
        />
      </div>
      {loading ? (
        <Loader />
      ) : (
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
      )}
    </section>
  );
}

