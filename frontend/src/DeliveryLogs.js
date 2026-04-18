import React, { useEffect, useState } from "react";
import { apiRequest } from "./api";
import brandMark from "./assets/brand-mark.svg";

const DeliveryLogs = ({ session, onNavigate }) => {
  const token = session?.token;
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadLogsData = async () => {
      try {
        setError("");
        const [alertsResponse, summaryResponse] = await Promise.all([
          apiRequest("/api/alerts", { token }).catch(() => []),
          apiRequest("/api/farmers/summary", { token }).catch(() => null)
        ]);

        setAlerts(Array.isArray(alertsResponse) ? alertsResponse : []);
        setSummary(summaryResponse);
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    loadLogsData();
  }, [token]);

  const smsAlerts = alerts.filter((alert) => String(alert.channel || "").toLowerCase() === "sms");
  const voiceAlerts = alerts.filter((alert) => String(alert.channel || "").toLowerCase() === "voice");
  const failedAlerts = alerts.filter((alert) => String(alert.status || "").toLowerCase() === "failed");
  const highSeverity = alerts.filter((alert) => String(alert.severity || "").toLowerCase() === "high");
  const platformOnly = alerts.filter((alert) => String(alert.status || "").toLowerCase() === "platform_only");

  const liveCards = [
    {
      title: "Registry Coverage",
      status: failedAlerts.length ? "Watch" : "Active",
      text: `${summary?.totalFarmers ?? 0} farmers in registry, with ${summary?.activeFarmers ?? 0} active profiles ready for communication.`,
      action: "Open Farmers",
      page: "farmers"
    },
    {
      title: "High Severity Cases",
      status: highSeverity.length ? "Active" : "Stable",
      text: `${highSeverity.length} high-severity weather advisories are now present in the live delivery ledger.`,
      action: "Open Live Alerts",
      page: "alerts"
    },
    {
      title: "Channel Dispatch",
      status: smsAlerts.length || voiceAlerts.length ? "Active" : "Stable",
      text: `${smsAlerts.length} SMS and ${voiceAlerts.length} voice dispatch records have been captured from live alert activity.`,
      action: "Open Broadcast",
      page: "broadcast"
    },
    {
      title: "Platform-only Records",
      status: platformOnly.length ? "Watch" : "Stable",
      text: `${platformOnly.length} delivery records were captured without a direct farmer-channel dispatch.`,
      action: "Open Overview",
      page: "dashboard"
    }
  ];

  return (
    <section className="dashboard-stack">
      <div className="panel delivery-hero-panel">
        <div className="delivery-hero-strip">
          <img src={brandMark} alt="AgroAI Weather mark" className="delivery-hero-logo" />
          <div>
            <p className="eyebrow">Satyameva Jayate</p>
            <h2>Bharat Sarkar Farmer Delivery Registry</h2>
            <p className="delivery-hero-copy">
              Farmer-facing communication records, outreach scheme status, and live message tracking
              can sit here in a more official delivery log layout.
            </p>
          </div>
        </div>
      </div>

      <div className="feature-grid delivery-scheme-grid">
        {liveCards.map((card) => (
          <article key={card.title} className="feature-card delivery-scheme-card">
            <div className="delivery-card-top">
              <strong>{card.title}</strong>
              <span className={`risk-badge ${card.status.toLowerCase() === "active" ? "sent" : card.status.toLowerCase() === "watch" ? "medium" : "low"}`}>
                {card.status}
              </span>
            </div>
            <p>{card.text}</p>
            <button className="ghost-button delivery-link-button" type="button" onClick={() => onNavigate?.(card.page)}>
              {card.action}
            </button>
          </article>
        ))}
      </div>

      <div className="panel delivery-registry-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Live Registry</p>
            <h2>Farmer delivery scheme ledger</h2>
          </div>
        </div>

        {error ? <p className="status error">{error}</p> : null}

        <div className="history-list">
          {alerts.length ? (
            alerts.map((alert) => (
              <article key={`${alert.id}-${alert.createdAt}`} className="history-item delivery-log-row">
                <div>
                  <strong>{alert.farmerName || alert.region}</strong>
                  <span>{alert.city || alert.region} | {alert.channel || "dashboard"} | {(alert.language || "en").toUpperCase()}</span>
                  <span>{alert.message}</span>
                </div>
                <div className="action-column">
                  <div className={`risk-badge ${String(alert.status || "").toLowerCase()}`}>{alert.status || "LIVE"}</div>
                  <span>{new Date(alert.createdAt).toLocaleString()}</span>
                </div>
              </article>
            ))
          ) : (
            <p className="muted">No live delivery records yet. Send alerts to populate the ledger.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default DeliveryLogs;
