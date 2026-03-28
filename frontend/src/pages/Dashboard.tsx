import { useEffect, useMemo, useState } from "react";
import { getSensors, type Sensor } from "../api/sensors";
import { SensorCard } from "../components/dashboard/SensorCard";
import { Loader } from "../components/common/Loader";
import { useSocket } from "../hooks/useSocket";
import { Input } from "../components/ui/input";
import { useAuth } from "../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    getSensors()
      .then(setSensors)
      .finally(() => setLoading(false));
  }, []);

  useSocket({
    onSensorUpdate(payload) {
      setSensors((prev) => prev.map((s) => (s.id === payload.sensorId ? { ...s, state: payload.state } : s)));
    },
    onAlertUpdated(payload) {
      if (payload.sensorId && payload.severity) {
        const nextState = payload.severity === "CRITICAL" ? "CRITICAL" : "WARNING";
        setSensors((prev) => prev.map((s) => (s.id === payload.sensorId ? { ...s, state: nextState } : s)));
      }
    }
  });

  const filtered = useMemo(() => {
    const base =
      user?.role === "SUPERVISOR" ? sensors : sensors.filter((s) => user?.zoneIds.includes(s.zoneId));
    if (!q.trim()) return base;
    const lc = q.toLowerCase();
    return base.filter((s) => s.name.toLowerCase().includes(lc) || s.id.toLowerCase().includes(lc));
  }, [q, sensors, user]);

  if (loading) return <Loader label="Loading sensors..." />;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Live Dashboard</h1>
        <div className="w-72">
          <Input placeholder="Search sensors..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {filtered.map((sensor) => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div>
    </section>
  );
}

