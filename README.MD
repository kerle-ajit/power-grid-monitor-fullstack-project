# GridWatch

Production-style real-time anomaly detection platform for power-grid sensors.

## Setup

1. Run:
   - `docker-compose up --build`
2. Frontend:
   - [http://localhost:5173](http://localhost:5173)
3. Backend health:
   - [http://localhost:4000/healthz](http://localhost:4000/healthz)

Default seeded users:
- `operator_north` / `password123`
- `operator_south` / `password123`
- `supervisor` / `password123`

## Architecture

### Data Flow

1. `POST /ingest` receives up to 1000 readings.
2. Readings are bulk inserted in PostgreSQL in one transaction (`createMany`) before response.
3. Batch id is pushed to BullMQ (`ingest_batches`) for async processing.
4. `ingestWorker` runs Rule A (threshold) and Rule B (spike vs previous 3).
5. `silentWorker` runs every 30 seconds to detect Rule C (>2 minutes no readings).
6. Each anomaly creates an alert (including suppressed alerts).
7. Sensor state is recomputed and pushed over Socket.IO room for that zone.
8. `escalationWorker` runs every 30 seconds and escalates critical open alerts older than 5 minutes exactly once.

### Backend Structure

`backend/src`:
- `app.ts`: Express wiring
- `server.ts`: bootstrap HTTP, sockets, workers
- `config/`: env parsing
- `database/`: Prisma client
- `modules/`: auth/sensors/readings/rules/anomalies/alerts/suppressions/zones/users
- `workers/`: `ingestWorker.ts`, `anomalyWorker.ts`, `silentWorker.ts`, `escalationWorker.ts`
- `sockets/`: Socket.IO server and room helpers
- `utils/`: auth middleware, zone checks, sensor state, errors

## Schema Decisions

Core tables:
- `reading`: time-series rows, indexed by `(sensorId, timestamp)` for fast history queries.
- `ruleConfig`: per-sensor thresholds/spike configs + severities.
- `anomaly`: append-only anomaly record, references sensor + optional reading.
- `alert`: one alert per anomaly, lifecycle status + assigned user + escalation marker.
- `alert_audit_log` (`AlertAuditLog`): append-only status transitions.
- `escalation_log` (`EscalationLog`): one row per alert (`unique(alertId)`) to enforce exactly-once escalation.
- `suppression`: suppression windows per sensor.
- `sensor_state_row`: cached sensor status for low-latency dashboard queries.

Important indexes:
- `reading(sensorId, timestamp)`
- `anomaly(sensorId, timestamp)`
- `alert(zoneId, status)` and `alert(sensorId, status)`
- `suppression(sensorId, startTime, endTime)`

## Real-Time Design (No Polling)

- Socket.IO is used exclusively for live updates.
- Each connection is JWT-authenticated.
- Users join zone rooms:
  - operators: assigned zones only
  - supervisors: all zones
- Events:
  - `sensor_state`: healthy/warning/critical/silent updates
  - `alert_event`: alert create/update/escalation updates

This enforces zone isolation in both API responses and push events.

## Alert Lifecycle + Audit

Allowed transitions:
- `OPEN -> ACKNOWLEDGED`
- `ACKNOWLEDGED -> RESOLVED`
- `OPEN -> RESOLVED`

Every transition writes an append-only `AlertAuditLog` row including user, from, to, timestamp.

## Suppression Behavior

- If suppression is active for anomaly timestamp:
  - anomaly is still recorded
  - alert is still created
  - alert is marked `suppressed=true`
  - socket notifications and auto-escalation are skipped

Handling when suppression is created while alert already open:
- Existing open alerts remain as-is.
- Suppression applies to future anomalies only.

## Historical Query

Endpoint:
- `GET /sensors/:id/history?from=&to=&page=&pageSize=`

Returns:
- readings in range
- `triggered` flag per reading
- linked anomaly list
- linked alert references per anomaly
- paginated (default 100)

Performance approach:
- use sensor/time composite index
- fetch paged readings first
- fetch anomalies only for that page’s reading ids

## Ingestion and Reliability Notes

- Ingest endpoint stores all rows durably before returning.
- Batch processing is async via BullMQ; failures are visible via `ingest_batch.status` and `lastError`.
- No silent drops: failed downstream processing is recoverable by replaying failed batches.

## What Is Finished

- Full backend API and worker pipeline
- Rule A/B/C anomaly logic
- Alert lifecycle API + audit logs
- Auto-escalation once-only behavior
- JWT auth and zone isolation at API + socket layer
- React + Vite + Tailwind dashboard with live socket updates
- Docker Compose with backend, frontend, postgres, redis
- Seed data:
  - 1000 sensors
  - 3 zones
  - 2 operators
  - 1 supervisor
  - 48 hours of readings

## Production Gap

With one extra week, the highest-value addition would be:
- stronger observability + SLO instrumentation (OpenTelemetry traces, worker lag metrics, ingest and history latency dashboards, dead-letter queue replay tooling).

