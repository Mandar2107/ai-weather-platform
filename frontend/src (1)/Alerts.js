import React, { useEffect, useState } from "react";
import { apiRequest } from "./api";
import socket from "./socket";

const Alerts = ({ session }) => {
  const [alerts, setAlerts] = useState([]);
  const [regionFilter, setRegionFilter] = useState("");
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
      setAlerts(response);
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
      <section className="panel">
        <p className="eyebrow">Live Alerts</p>
        <h2>Login from the dashboard to view alert history.</h2>
      </section>
    );
  }

  return (
    <section className="panel alerts-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Realtime Feed</p>
          <h2>Alert stream</h2>
        </div>

        <div className="filter-row">
          <input
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.target.value)}
            placeholder="Filter by region"
          />
          <button className="secondary-button" onClick={() => loadAlerts(regionFilter)}>
            Apply
          </button>
        </div>
      </div>

      {error ? <p className="status error">{error}</p> : null}

      <div className="history-list">
        {alerts.length ? (
          alerts.map((alert) => (
            <article key={`${alert.id}-${alert.createdAt}`} className="alert-item">
              <div>
                <strong>{alert.farmerName || alert.region}</strong>
                <span>{alert.city || alert.region} · {alert.channel || "dashboard"} · {(alert.language || "en").toUpperCase()}</span>
                <span>{alert.message}</span>
              </div>
              <div>
                <div className={`risk-badge ${String(alert.status || "").toLowerCase()}`}>
                  {alert.status || "LIVE"}
                </div>
                <span>{new Date(alert.createdAt).toLocaleString()}</span>
              </div>
            </article>
          ))
        ) : (
          <p className="muted">No alerts yet. Send one from the dashboard.</p>
        )}
      </div>
    </section>
  );
};

export default Alerts;
