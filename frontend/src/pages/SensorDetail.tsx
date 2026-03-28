import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSensorHistory, getSensors, type Sensor, type SensorHistoryRow } from "../api/sensors";
import { ReadingTable } from "../components/sensor/ReadingTable";
import { AnomalyList } from "../components/sensor/AnomalyList";
import { SuppressionStatus } from "../components/sensor/SuppressionStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { createSuppression } from "../api/suppressions";

export default function SensorDetailPage() {
  const { id = "" } = useParams();
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [readings, setReadings] = useState<SensorHistoryRow[]>([]);

  async function load() {
    const [all, history] = await Promise.all([
      getSensors(),
      getSensorHistory(id, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString())
    ]);
    setSensor(all.find((s) => s.id === id) ?? null);
    setReadings(history.readings);
  }

  useEffect(() => {
    void load();
  }, [id]);

  const suppressionActive = useMemo(() => readings.some((r) => r.anomalies.some((a) => a.suppressed)), [readings]);

  async function quickSuppress() {
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await createSuppression(id, start, end);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sensor Detail</h1>
          <div className="text-sm text-slate-400">{sensor?.name ?? id}</div>
        </div>
        <Link to="/" className="text-sm text-blue-400">Back to dashboard</Link>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Status</CardTitle>
          <Button size="sm" onClick={quickSuppress}>Suppress 1h</Button>
        </CardHeader>
        <CardContent>
          <SuppressionStatus active={suppressionActive} />
        </CardContent>
      </Card>

      <Tabs defaultValue="readings">
        <TabsList>
          <TabsTrigger value="readings">Recent Readings</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>
        <TabsContent value="readings">
          <ReadingTable readings={readings} />
        </TabsContent>
        <TabsContent value="anomalies">
          <AnomalyList readings={readings} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

