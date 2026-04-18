import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import Alerts from "./Alerts";
import Farmers from "./Farmers";
import BroadcastCenter from "./BroadcastCenter";
import SystemPage from "./SystemPage";
import WeatherMonitor from "./WeatherMonitor";
import DeliveryLogs from "./DeliveryLogs";

const STORAGE_KEY = "ai-weather-session";

const Layout = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [session, setSession] = useState(null);

  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY);

    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
  }, []);

  const handleSessionChange = (nextSession) => {
    setSession(nextSession);

    if (nextSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      return;
    }

    setActivePage("dashboard");
    localStorage.removeItem(STORAGE_KEY);
  };

  const renderPage = () => {
    if (activePage === "weather") {
      return <WeatherMonitor />;
    }

    if (activePage === "broadcast") {
      return <BroadcastCenter session={session} />;
    }

    if (activePage === "logs") {
      return <DeliveryLogs session={session} onNavigate={setActivePage} />;
    }

    if (activePage === "farmers") {
      return <Farmers session={session} />;
    }

    if (activePage === "alerts") {
      return <Alerts session={session} />;
    }

    return <Dashboard session={session} onSessionChange={handleSessionChange} onNavigate={setActivePage} />;
  };

  if (!session) {
    return (
      <main className="workspace workspace-public">
        <div className="page">{renderPage()}</div>
      </main>
    );
  }

  return (
    <div className="shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="workspace">
        <Navbar session={session} onLogout={() => handleSessionChange(null)} activePage={activePage} />
        <div className="page">{renderPage()}</div>
      </main>
    </div>
  );
};

export default Layout;
