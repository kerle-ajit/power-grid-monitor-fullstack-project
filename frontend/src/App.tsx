import { Outlet } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <Sidebar />
        <main className="min-h-[calc(100vh-3.5rem)] w-full flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
