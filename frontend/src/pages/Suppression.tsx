import { useCallback, useEffect, useState } from "react";
import { getSensors, type Sensor } from "../api/sensors";
import { createSuppression, listSuppressions, type SuppressionEntry } from "../api/suppressions";
import { Dialog } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Loader } from "../components/common/Loader";

export default function SuppressionPage() {
  const [open, setOpen] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorId, setSensorId] = useState("");
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<SuppressionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listSuppressions();
      setRows(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getSensors().then((s) => {
      setSensors(s);
      if (s.length) setSensorId(s[0].id);
    });
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  async function submit() {
    await createSuppression(sensorId, new Date(startTime).toISOString(), new Date(endTime).toISOString());
    setMessage("Suppression created successfully.");
    setOpen(false);
    await refreshList();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Suppression Management</h1>
        <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
          Add Suppression Window
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Policy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          During maintenance windows, anomalies are still recorded; alerts are marked suppressed. List below is zone-scoped for operators.
          {message ? <div className="mt-2 text-emerald-400">{message}</div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active &amp; scheduled suppressions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader label="Loading suppressions..." />
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sensor</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.sensor.name}</div>
                        <div className="font-mono text-xs text-slate-500">{r.sensorId}</div>
                      </TableCell>
                      <TableCell className="text-xs">{r.sensor.zoneId}</TableCell>
                      <TableCell>{new Date(r.startTime).toLocaleString()}</TableCell>
                      <TableCell>{new Date(r.endTime).toLocaleString()}</TableCell>
                      <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length === 0 ? <div className="py-6 text-center text-sm text-slate-500">No suppressions yet.</div> : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen} title="Create Suppression">
        <div className="space-y-3">
          <Select
            value={sensorId}
            onValueChange={setSensorId}
            options={sensors.map((s) => ({ value: s.id, label: `${s.name} (${s.id})` }))}
            className="w-full"
          />
          <div>
            <label className="mb-1 block text-xs text-slate-400">Start</label>
            <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">End</label>
            <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <Button className="w-full" onClick={submit}>
            Create
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
