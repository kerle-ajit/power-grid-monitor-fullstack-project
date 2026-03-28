import { useEffect, useState } from "react";
import { getSensors, type Sensor } from "../api/sensors";
import { createSuppression } from "../api/suppressions";
import { Dialog } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function SuppressionPage() {
  const [open, setOpen] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorId, setSensorId] = useState("");
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
  const [message, setMessage] = useState("");

  useEffect(() => {
    getSensors().then((rows) => {
      setSensors(rows);
      if (rows.length) setSensorId(rows[0].id);
    });
  }, []);

  async function submit() {
    await createSuppression(sensorId, new Date(startTime).toISOString(), new Date(endTime).toISOString());
    setMessage("Suppression created successfully.");
    setOpen(false);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Suppression Management</h1>
        <Button onClick={() => setOpen(true)}>Add Suppression Window</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current Policy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          Create temporary suppression windows during maintenance. Anomalies are still recorded, but alerts are flagged as suppressed.
          {message ? <div className="mt-2 text-emerald-400">{message}</div> : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen} title="Create Suppression">
        <div className="space-y-3">
          <Select value={sensorId} onValueChange={setSensorId} options={sensors.map((s) => ({ value: s.id, label: `${s.name} (${s.id})` }))} className="w-full" />
          <div>
            <label className="mb-1 block text-xs text-slate-400">Start</label>
            <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">End</label>
            <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <Button className="w-full" onClick={submit}>Create</Button>
        </div>
      </Dialog>
    </section>
  );
}

