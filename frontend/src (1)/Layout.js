import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import Alerts from "./Alerts";
import Farmers from "./Farmers";
import BroadcastCenter from "./BroadcastCenter";
import SystemPage from "./SystemPage";

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

    localStorage.removeItem(STORAGE_KEY);
  };

  const renderPage = () => {
    if (activePage === "weather") {
      return (
        <SystemPage
          eyebrow="Weather Monitor"
          title="City-wise weather monitoring"
          description="Track weather collection health, monitor active target cities, and review recent observation readiness before AI analysis."
          cards={[
            { title: "Target Cities", text: "Monitor high-priority cities like Nipani and expand location coverage as farmer enrollment grows." },
            { title: "Freshness Control", text: "Use this area later for weather polling schedules, stale-data warnings, and refresh intervals." },
            { title: "Risk Readiness", text: "Confirm every city has fresh weather data before broadcasting multilingual advisories." }
          ]}
        />
      );
    }

    if (activePage === "broadcast") {
      return <BroadcastCenter session={session} />;
    }

    if (activePage === "logs") {
      return (
        <SystemPage
          eyebrow="Delivery Logs"
          title="Message delivery tracking"
          description="Keep this section for channel-wise delivery visibility, retries, and provider callback history."
          cards={[
            { title: "SMS Status", text: "Track sent, delivered, failed, and retried SMS alerts city by city." },
            { title: "Voice Status", text: "Monitor voice call completion, unanswered calls, and replay attempts once provider integration is live." },
            { title: "Audit Trail", text: "Maintain a full history of who triggered each campaign, when it was sent, and which farmers were targeted." }
          ]}
        />
      );
    }

    if (activePage === "farmers") {
      return <Farmers session={session} />;
    }

    if (activePage === "alerts") {
      return <Alerts session={session} />;
    }

    return <Dashboard session={session} onSessionChange={handleSessionChange} />;
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
