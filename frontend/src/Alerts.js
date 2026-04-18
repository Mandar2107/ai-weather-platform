import React, { useEffect, useState } from "react";
import { apiRequest } from "./api";
import socket from "./socket";

const Alerts = ({ session }) => {
  const [alerts, setAlerts] = useState([]);
  const [regionFilter, setRegionFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [error, setError] = useState("");

  const token = session?.token;

  const loadAlerts = async (region = regionFilter) => {
    if (!token) {
      return;
    }

    try {
      setError("");
      const query = region ? `?region=${encodeURIComponent(region)}` : "";
      const response = await apiRequest(`/api/alerts${query}`, { token });
      setAlerts(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    loadAlerts();

    socket.connect();

    const handleNewAlert = (alert) => {
      setAlerts((currentAlerts) => [alert, ...currentAlerts]);
    };

    socket.on("new_alert", handleNewAlert);

    return () => {
      socket.off("new_alert", handleNewAlert);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!session) {
    return (
      <section className="panel alerts-monitor-panel">
        <p className="eyebrow">Live Alerts</p>
        <h2>Login from the dashboard to view alert history.</h2>
      </section>
    );
  }

  const filteredAlerts = alerts.filter((alert) => {
    const searchable = `${alert.farmerName || ""} ${alert.region || ""} ${alert.city || ""} ${alert.phone || ""} ${alert.message || ""}`.toLowerCase();
    const matchesSearch = searchable.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || String(alert.status || "").toLowerCase() === statusFilter;
    const matchesChannel = channelFilter === "all" || String(alert.channel || "").toLowerCase() === channelFilter;
    const matchesSeverity = severityFilter === "all" || String(alert.severity || "").toLowerCase() === severityFilter;
    const matchesRegion = !regionFilter || `${alert.region || ""} ${alert.city || ""}`.toLowerCase().includes(regionFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesChannel && matchesSeverity && matchesRegion;
  });

  const sentCount = alerts.filter((alert) => String(alert.status || "").toLowerCase() === "sent").length;
  const failedCount = alerts.filter((alert) => String(alert.status || "").toLowerCase() === "failed").length;
  const highCount = alerts.filter((alert) => String(alert.severity || "").toLowerCase() === "high").length;

  return (
    <section className="dashboard-stack alerts-page">
      <div className="summary-strip">
        <div className="summary-card"><span>Total Alerts</span><strong>{alerts.length}</strong></div>
        <div className="summary-card"><span>Sent</span><strong>{sentCount}</strong></div>
        <div className="summary-card"><span>Failed</span><strong>{failedCount}</strong></div>
        <div className="summary-card"><span>High Severity</span><strong>{highCount}</strong></div>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Realtime Feed</p>
            <h2>Alert stream</h2>
          </div>

          <button className="ghost-button" type="button" onClick={() => loadAlerts(regionFilter)}>
            Refresh
          </button>
        </div>

        <div className="form-grid alerts-filter-grid">
          <label>
            Search
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search farmer, phone, message..."
            />
          </label>

          <label>
            Region
            <input
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
              placeholder="Filter by region"
            />
          </label>

          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="platform_only">Platform only</option>
            </select>
          </label>

          <label>
            Channel
            <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="sms">SMS</option>
              <option value="voice">Voice</option>
              <option value="dashboard">Dashboard</option>
            </select>
          </label>

          <label>
            Severity
            <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>

        {error ? <p className="status error">{error}</p> : null}

        <div className="history-list alerts-scroll-area">
          {filteredAlerts.length ? (
            filteredAlerts.map((alert) => (
              <article key={`${alert.id}-${alert.createdAt}`} className="alert-item alert-stream-card">
                <div>
                  <strong>{alert.farmerName || alert.region}</strong>
                  <span>{alert.city || alert.region} | {alert.channel || "dashboard"} | {(alert.language || "en").toUpperCase()}</span>
                  <span>{alert.message}</span>
                  <span className="alert-stream-meta">
                    {alert.phone || "No phone"} | {alert.riskType || "WEATHER"} | {alert.severity || "LOW"}
                  </span>
                </div>
                <div className="action-column">
                  <div className={`risk-badge ${String(alert.status || "").toLowerCase()}`}>
                    {alert.status || "LIVE"}
                  </div>
                  <div className={`risk-badge ${String(alert.severity || "").toLowerCase()}`}>
                    {alert.severity || "LOW"}
                  </div>
                  <span>{new Date(alert.createdAt).toLocaleString()}</span>
                </div>
              </article>
            ))
          ) : (
            <p className="muted">No alerts match the current filters.</p>
          )}
        </div>
      </section>
    </section>
  );
};

export default Alerts;
