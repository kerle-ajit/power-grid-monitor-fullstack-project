import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSensorHistory, getSensors, type Sensor, type SensorHistoryRow } from "../api/sensors";
import { listSuppressions } from "../api/suppressions";
import { ReadingTable } from "../components/sensor/ReadingTable";
import { AnomalyList } from "../components/sensor/AnomalyList";
import { SuppressionStatus } from "../components/sensor/SuppressionStatus";
import { SensorAlertsTable } from "../components/sensor/SensorAlertsTable";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { createSuppression } from "../api/suppressions";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SensorDetailPage() {
  const { id = "" } = useParams();
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [readings, setReadings] = useState<SensorHistoryRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const defaultFromIso = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), []);
  const defaultToIso = useMemo(() => new Date().toISOString(), []);

  const [historyFrom, setHistoryFrom] = useState(defaultFromIso);
  const [historyTo, setHistoryTo] = useState(defaultToIso);
  const [fromInput, setFromInput] = useState(() => toLocalInput(defaultFromIso));
  const [toInput, setToInput] = useState(() => toLocalInput(defaultToIso));

  const [loading, setLoading] = useState(false);
  const [suppressionList, setSuppressionList] = useState<Awaited<ReturnType<typeof listSuppressions>>>([]);

  const loadSensor = useCallback(async () => {
    const all = await getSensors();
    setSensor(all.find((s) => s.id === id) ?? null);
  }, [id]);

  const loadSuppressionsMeta = useCallback(async () => {
    const list = await listSuppressions();
    setSuppressionList(list);
  }, []);

  const loadHistory = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const history = await getSensorHistory(id, historyFrom, historyTo, page, pageSize);
      setReadings(history.readings);
      setTotalCount(history.totalCount);
    } finally {
      setLoading(false);
    }
  }, [id, historyFrom, historyTo, page, pageSize]);

  useEffect(() => {
    void loadSensor();
    void loadSuppressionsMeta();
  }, [loadSensor, loadSuppressionsMeta]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const suppressionActive = useMemo(() => {
    const now = Date.now();
    return suppressionList.some(
      (s) =>
        s.sensorId === id &&
        new Date(s.startTime).getTime() <= now &&
        new Date(s.endTime).getTime() >= now
    );
  }, [suppressionList, id]);

  async function quickSuppress() {
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await createSuppression(id, start, end);
    await loadSuppressionsMeta();
  }

  function applyRange() {
    setHistoryFrom(new Date(fromInput).toISOString());
    setHistoryTo(new Date(toInput).toISOString());
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sensor Detail</h1>
          <div className="text-sm text-slate-400">{sensor?.name ?? id}</div>
        </div>
        <Link to="/" className="text-sm text-blue-400">
          Back to dashboard
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Suppression</CardTitle>
          <Button size="sm" onClick={quickSuppress}>
            Suppress 1h
          </Button>
        </CardHeader>
        <CardContent>
          <SuppressionStatus active={suppressionActive} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <p className="text-sm text-slate-400">Paginated readings with anomaly and alert references per row.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs text-slate-400">From</label>
              <Input type="datetime-local" value={fromInput} onChange={(e) => setFromInput(e.target.value)} />
            </div>
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs text-slate-400">To</label>
              <Input type="datetime-local" value={toInput} onChange={(e) => setToInput(e.target.value)} />
            </div>
            <div className="w-full sm:w-32">
              <label className="mb-1 block text-xs text-slate-400">Page size</label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
                options={[
                  { value: "10", label: "10" },
                  { value: "25", label: "25" },
                  { value: "50", label: "50" },
                  { value: "100", label: "100" }
                ]}
              />
            </div>
            <Button variant="secondary" onClick={applyRange}>
              Apply range
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-400">
              Page {page} of {totalPages} · {totalCount} readings in range
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>

          {loading ? <div className="text-sm text-slate-400">Loading history…</div> : <ReadingTable readings={readings} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alerts for this sensor</CardTitle>
        </CardHeader>
        <CardContent>
          <SensorAlertsTable sensorId={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anomalies</CardTitle>
          <p className="text-sm text-slate-400">Derived from the current history page (same time window and pagination).</p>
        </CardHeader>
        <CardContent>
          <AnomalyList readings={readings} />
        </CardContent>
      </Card>
    </section>
  );
}
