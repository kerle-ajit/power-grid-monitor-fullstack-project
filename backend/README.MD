🔐 1. Login API
POST /auth/login

Sample Response

{
  "token": "JWT_TOKEN_HERE",
  "role": "OPERATOR",
  "zoneIds": [
    "c1012b4d-93a4-4838-aa9e-3bdeaf5e1c1a"
  ]
}

📡 2. Fetch Sensors
GET /sensors

Returns all sensors accessible to the logged-in operator or supervisor.

Sample Response

{
  "sensors": [
    {
      "id": "sensor-0904",
      "name": "Sensor 904",
      "zoneId": "c1012b4d-93a4-4838-aa9e-3bdeaf5e1c1a",
      "state": "SILENT",
      "stateUpdatedAt": "2026-03-28T09:43:00.123Z",
      "lastReadingAt": "2026-03-28T09:40:36.962Z"
    }
  ]
}


🚨 3. Alerts Listing
GET /alerts?page=1&pageSize=100

Sample Response

{
  "page": 1,
  "pageSize": 100,
  "totalCount": 336,
  "alerts": [
    {
      "alertId": "6ec5fbd2-dcf5-4786-b847-e56e48e8933e",
      "status": "OPEN",
      "severity": "CRITICAL",
      "suppressed": false,
      "createdAt": "2026-03-28T09:46:37.369Z",
      "updatedAt": "2026-03-28T09:52:00.070Z",
      "sensorId": "sensor-0904",
      "zoneId": "c1012b4d-93a4-4838-aa9e-3bdeaf5e1c1a",
      "anomaly": {
        "anomalyId": "585d0536-3b8b-4a02-b776-dd035a2cbb10",
        "type": "SILENCE",
        "metric": null,
        "timestamp": "2026-03-28T09:46:30.063Z",
        "readingId": null
      }
    }
  ]
}


🛑 4. Resolve Alert
POST /alerts/:alertId/resolve

Sample Response

{
  "alertId": "122da5c2-478d-4f06-a127-53eb355b54dd",
  "status": "RESOLVED"
}


🔕 5. Get All Suppressions
GET /suppressions

Sample Response

[
  {
    "id": "42ac0c20-a348-40b6-afe0-9509075225ea",
    "sensorId": "sensor-0904",
    "startTime": "2026-03-28T09:42:56.837Z",
    "endTime": "2026-03-28T10:42:56.837Z",
    "createdAt": "2026-03-28T09:42:56.862Z",
    "createdByUserId": "6e1a6f29-6d2e-4c67-8e07-b4fb3db61dae",
    "sensor": {
      "name": "Sensor 904",
      "zoneId": "c1012b4d-93a4-4838-aa9e-3bdeaf5e1c1a"
    }
  }
]

🕒 6. Create Suppression Window
POST /suppressions

Request

{
  "sensorId": "sensor-0904",
  "startTime": "2026-03-28T14:28:00.000Z",
  "endTime": "2026-03-29T07:26:00.000Z"
}

Response

{
  "id": "246d97ae-f1f2-45cc-9d29-c3f656b5a8d6",
  "sensorId": "sensor-0904",
  "startTime": "2026-03-28T14:28:00.000Z",
  "endTime": "2026-03-29T07:26:00.000Z",
  "createdAt": "2026-03-28T11:57:10.054Z"
}

📊 7. Sensor History (Readings + Anomalies)
GET /sensors/:sensorId/history

Example:

/sensors/sensor-0904/history?from=2026-03-21T11:31:42.932Z&to=2026-03-28T11:31:42.932Z&page=1&pageSize=25

Sample Response

{
  "page": 1,
  "pageSize": 25,
  "totalCount": 289,
  "readings": [
    {
      "readingId": "0247d48a-5bb5-4b6c-9d6f-fcd0f886085d",
      "timestamp": "2026-03-26T09:40:36.962Z",
      "voltage": 219.10,
      "current": 9.60,
      "temperature": 37.03,
      "statusCode": 0,
      "triggered": false,
      "anomalies": []
    }
  ]
}



Due to time constraints, all core backend features were fully implemented but not every scenario was deeply tested end-to-end.
