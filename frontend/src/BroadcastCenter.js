import React, { useState } from "react";
import { apiRequest } from "./api";

const BroadcastCenter = ({ session }) => {
  const token = session?.token;
  const [city, setCity] = useState("Nipani");
  const [farmers, setFarmers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [channels, setChannels] = useState(["sms", "voice"]);
  const [messageMode, setMessageMode] = useState("ai");
  const [customMessage, setCustomMessage] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [preview, setPreview] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCount = selectedIds.length;
  const selectedFarmers = farmers.filter((farmer) => selectedIds.includes(farmer.id));
  const smsCount = selectedFarmers.filter((farmer) => farmer.smsEnabled && channels.includes("sms")).length;
  const voiceCount = selectedFarmers.filter((farmer) => farmer.voiceEnabled && channels.includes("voice")).length;
  const filteredFarmers = farmers.filter((farmer) => {
    const searchable = `${farmer.name} ${farmer.city} ${farmer.phone} ${farmer.cropType || ""}`.toLowerCase();
    return searchable.includes(farmerSearch.toLowerCase());
  });

  const loadFarmers = async () => {
    setBusyAction("load");
    setError("");
    setMessage("");

    try {
      const data = await apiRequest(`/api/farmers?city=${encodeURIComponent(city)}`, { token });
      setFarmers(Array.isArray(data) ? data : []);
      setSelectedIds((Array.isArray(data) ? data : []).map((farmer) => farmer.id));
      setPreview(null);
      setMessage(`${data.length} farmer(s) loaded for ${city}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  };

  const toggleFarmer = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleChannel = (channel) => {
    setChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]
    );
  };

  const selectAll = () => {
    setSelectedIds(farmers.map((farmer) => farmer.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const buildPayload = () => ({
    city,
    region: city,
    farmerIds: selectedIds,
    channels,
    messageMode,
    customMessage,
    recommendation
  });

  const previewSelected = async () => {
    setBusyAction("preview");
    setError("");
    setMessage("");

    try {
      const data = await apiRequest("/api/alerts/preview", {
        method: "POST",
        token,
        body: buildPayload()
      });
      setPreview(data);
      setMessage(`Preview ready for ${data.summary.totalRecipients} selected farmer(s).`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  };

  const sendSelected = async () => {
    setBusyAction("send");
    setError("");
    setMessage("");

    try {
      const data = await apiRequest("/api/alerts/send", {
        method: "POST",
        token,
        body: buildPayload()
      });
      setPreview(data.preview);
      setMessage(`${data.deliveries.length} delivery record(s) created.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  };

  if (!session) {
    return (
      <section className="panel">
        <p className="eyebrow">Broadcast Center</p>
        <h2>Login from the dashboard to send region-wise broadcasts.</h2>
      </section>
    );
  }

  return (
    <section className="dashboard-stack broadcast-page">
      <div className="summary-strip">
        <div className="summary-card"><span>City Loaded</span><strong>{city || "No city"}</strong></div>
        <div className="summary-card"><span>Selected Farmers</span><strong>{selectedCount}</strong></div>
        <div className="summary-card"><span>SMS Ready</span><strong>{smsCount}</strong></div>
        <div className="summary-card"><span>Voice Ready</span><strong>{voiceCount}</strong></div>
      </div>

      <div className="content-grid">
        <div className="panel broadcast-command-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Target Region</p>
              <h2>Broadcast command center</h2>
            </div>
          </div>

          <label>
            City / Region
            <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Nipani" />
          </label>

          <div className="button-row">
            <button className="primary-button" onClick={loadFarmers} disabled={busyAction === "load"}>
              {busyAction === "load" ? "Loading..." : "Load farmers"}
            </button>
            <button className="ghost-button" onClick={selectAll} disabled={!farmers.length}>
              Select all
            </button>
            <button className="ghost-button" onClick={clearAll} disabled={!selectedIds.length}>
              Clear
            </button>
          </div>

          <div className="checkbox-row">
            <label className="check-pill">
              <input type="checkbox" checked={channels.includes("sms")} onChange={() => toggleChannel("sms")} />
              SMS
            </label>
            <label className="check-pill">
              <input type="checkbox" checked={channels.includes("voice")} onChange={() => toggleChannel("voice")} />
              Voice
            </label>
            <label className="check-pill">
              <input type="checkbox" checked={channels.includes("dashboard")} onChange={() => toggleChannel("dashboard")} />
              Log only
            </label>
          </div>

          <p className="muted">
            Voice uses your Twilio number only as the caller ID. The actual calls go to the selected farmers' saved phone numbers.
          </p>

          <div className="toggle-row">
            <button
              type="button"
              className={messageMode === "ai" ? "toggle-button active" : "toggle-button"}
              onClick={() => setMessageMode("ai")}
            >
              AI message
            </button>
            <button
              type="button"
              className={messageMode === "custom" ? "toggle-button active" : "toggle-button"}
              onClick={() => setMessageMode("custom")}
            >
              Custom message
            </button>
          </div>

          {messageMode === "custom" ? (
            <>
              <label>
                Recommendation
                <input value={recommendation} onChange={(event) => setRecommendation(event.target.value)} placeholder="Heavy rain expected. Protect harvested crop." />
              </label>
              <label>
                Custom message
                <textarea value={customMessage} onChange={(event) => setCustomMessage(event.target.value)} rows="4" placeholder="Farmers in Nipani, heavy rain expected..." />
              </label>
            </>
          ) : (
            <p className="muted">AI mode uses each farmer's language and crop profile automatically.</p>
          )}

          <div className="button-row">
            <button className="secondary-button" onClick={previewSelected} disabled={!selectedCount || busyAction === "preview"}>
              {busyAction === "preview" ? "Preparing..." : "Preview selected"}
            </button>
            <button className="primary-button" onClick={sendSelected} disabled={!selectedCount || busyAction === "send"}>
              {busyAction === "send" ? "Sending..." : "Send to selected"}
            </button>
          </div>

          {error ? <p className="status error">{error}</p> : null}
          {message ? <p className="status success">{message}</p> : null}
        </div>

        <div className="panel broadcast-selection-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Selected Farmers</p>
              <h2>{selectedCount} recipient(s)</h2>
            </div>
          </div>

          <label>
            Search farmers
            <input
              value={farmerSearch}
              onChange={(event) => setFarmerSearch(event.target.value)}
              placeholder="Search name, city, crop, phone..."
            />
          </label>

          <div className="history-list broadcast-scroll-area">
            {filteredFarmers.length ? (
              filteredFarmers.map((farmer) => (
                <article key={farmer.id} className="history-item selectable-item">
                  <label className="farmer-select">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(farmer.id)}
                      onChange={() => toggleFarmer(farmer.id)}
                    />
                    <div>
                      <strong>{farmer.name}</strong>
                      <span>{farmer.city} | {farmer.cropType || "No crop"} | {farmer.language.toUpperCase()}</span>
                      <span>{farmer.phone}</span>
                    </div>
                  </label>
                </article>
              ))
            ) : (
              <p className="muted">Load a city to show matching farmers with checkboxes.</p>
            )}
          </div>
        </div>
      </div>

      <div className="panel broadcast-preview-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>Recipient output and send summary</h2>
          </div>
        </div>

        {preview ? (
          <>
            <div className="summary-mini-grid">
              <div className="mini-card"><span>Total</span><strong>{preview.summary.totalRecipients}</strong></div>
              <div className="mini-card"><span>SMS</span><strong>{preview.summary.byChannel.sms || 0}</strong></div>
              <div className="mini-card"><span>Voice</span><strong>{preview.summary.byChannel.voice || 0}</strong></div>
              <div className="mini-card"><span>Dashboard</span><strong>{preview.summary.byChannel.dashboard || 0}</strong></div>
            </div>

            <div className="history-list broadcast-scroll-area">
              {preview.recipients.map((recipient) => (
                <article key={recipient.id} className="history-item">
                  <div>
                    <strong>{recipient.name}</strong>
                    <span>{recipient.city} | {recipient.language.toUpperCase()} | {recipient.channels.join(", ")}</span>
                    <span>{recipient.previewMessage}</span>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">Preview the selected farmers before sending voice calls or SMS.</p>
        )}
      </div>
    </section>
  );
};

export default BroadcastCenter;
