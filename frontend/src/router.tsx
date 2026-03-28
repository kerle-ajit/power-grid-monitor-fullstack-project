import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./App";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import AlertsPage from "./pages/Alerts";
import SensorDetailPage from "./pages/SensorDetail";
import SuppressionPage from "./pages/Suppression";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "sensors/:id", element: <SensorDetailPage /> },
      { path: "suppression", element: <SuppressionPage /> }
    ]
  }
]);

