import React, { useEffect, useState } from "react";
import { apiRequest } from "./api";
import brandMark from "./assets/brand-mark.svg";
import heroScene from "./assets/hero-scene.svg";

const DEFAULT_REGION = "Nipani";
const welcomeHighlights = [
  {
    title: "City-Wise Monitoring",
    text: "Track weather risk region by region and instantly prepare alerts for all mapped farmers."
  },
  {
    title: "AI Advisory Engine",
    text: "Generate crop-aware warnings and recommendations in Marathi, Hindi, or English."
  },
  {
    title: "Broadcast Control",
    text: "Preview recipients, switch between AI and custom messaging, and send through SMS or voice."
  }
];

const operatorSteps = [
  "Enroll farmers city-wise with phone, crop, and language preference.",
  "Fetch live weather for the target city.",
  "Run AI risk analysis to generate advisory logic.",
  "Preview all targeted farmers before sending the broadcast.",
  "Send SMS and voice alerts, then monitor delivery from the alerts page."
];

const Dashboard = ({ session, onSessionChange, onNavigate }) => {
  const [authMode, setAuthMode] = useState("login");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [weather, setWeather] = useState(null);
  const [history, setHistory] = useState([]);
  const [risk, setRisk] = useState(null);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [providers, setProviders] = useState(null);
  const [preview, setPreview] = useState(null);
  const [languagePreview, setLanguagePreview] = useState(null);
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [composer, setComposer] = useState({
    messageMode: "ai",
    customMessage: "",
    recommendation: "",
    channels: ["sms", "voice"],
    language: "mr"
  });

  const token = session?.token;

  const loadDashboardData = async (nextRegion = region) => {
    if (!token) {
      return;
    }

    const [latestWeather, weatherHistory, farmerSummary, latestAlerts, providerSettings] = await Promise.all([
      apiRequest(`/api/weather?region=${encodeURIComponent(nextRegion)}&latest=true`, { token }).catch(() => null),
      apiRequest(`/api/weather?region=${encodeURIComponent(nextRegion)}`, { token }).catch(() => []),
      apiRequest("/api/farmers/summary", { token }).catch(() => null),
      apiRequest("/api/alerts", { token }).catch(() => []),
      apiRequest("/api/settings/providers", { token }).catch(() => null)
    ]);

    setWeather(latestWeather);
    setHistory(Array.isArray(weatherHistory) ? weatherHistory : []);
    setSummary(farmerSummary);
    setAlerts(Array.isArray(latestAlerts) ? latestAlerts : []);
    setProviders(providerSettings);
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCredentialChange = (event) => {
    setCredentials((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleComposerChange = (event) => {
    const { name, value } = event.target;
    setComposer((current) => ({
      ...current,
      [name]: value
    }));
  };

  const toggleChannel = (channel) => {
    setComposer((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel]
    }));
  };

  const buildPayload = () => ({
    region,
    city: region,
    riskType: risk?.riskType || "WEATHER",
    severity: risk?.severity || "LOW",
    recommendation: composer.messageMode === "custom"
      ? composer.recommendation
      : risk?.recommendation || "",
    messageMode: composer.messageMode,
    customMessage: composer.customMessage,
    channels: composer.channels,
    language: composer.language
  });

  const submitAuth = async (event) => {
    event.preventDefault();
    setBusyAction("auth");
    setError("");
    setMessage("");

    try {
      if (authMode === "register") {
        await apiRequest("/api/auth/register", {
          method: "POST",
          body: credentials
        });
      }

      const loginResponse = await apiRequest("/api/auth/login", {
        method: "POST",
        body: credentials
      });

      onSessionChange(loginResponse);
      setMessage("Operator session started.");
      setCredentials({ username: credentials.username, password: "" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  };

  const fetchLiveWeather = async () => {
    setBusyAction("weather");
    setError("");
    setMessage("");

    try {
      const liveWeather = await apiRequest("/api/weather/fetch", {
        method: "POST",
        token,
        body: { region }
      });

      setWeather(liveWeather);
      setRisk(null);
      setPreview(null);
      setMessage(`Live weather updated for ${region}.`);
      await loadDashboardData(region);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  };

  const analyzeRisk = async () => {
    setBusyAction("risk");
    setError("");
    setMessage("");

    try {
      const nextRisk = await apiRequest("/api/ai/analyze", {
        method: "POST",
        token,
        body: { region }
      });

      setRisk(nextRisk);
      setComposer((current) => ({
        ...current,
        recommendation: nextRisk.recommendation
      }));
      setPreview(null);
      setMessage(`AI risk scored for ${region}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  };

  const previewAlert = async () => {
    setBusyAction("preview");
    setError("");
    setMessage("");

    try {
      const response = await apiRequest("/api/alerts/preview", {
        method: "POST",
        token,
        body: buildPayload()
      });

      setPreview(response);
      setMessage(`Recipient preview ready for ${response.summary.region}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  };

  const previewLanguages = async () => {
    setBusyAction("language-preview");
    setError("");
    setMessage("");

    try {
      const response = await apiRequest("/api/alerts/language-preview", {
        method: "POST",
        token,
        body: {
          ...buildPayload(),
          cropType: preview?.recipients?.[0]?.cropType || "Sugarcane"
        }
      });

      setLanguagePreview(response);
      setMessage("Language preview ready.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  };

  const sendAlert = async () => {
    setBusyAction("alert");
    setError("");
    setMessage("");

    try {
      const response = await apiRequest("/api/alerts/send", {
        method: "POST",
        token,
        body: buildPayload()
      });

      setPreview(response.preview);
      setMessage(`${response.deliveries.length} delivery record(s) created for ${region}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  };

  const highPriorityAlerts = alerts.filter((alert) => String(alert.severity || "").toUpperCase() === "HIGH");
  const failedDeliveries = alerts.filter((alert) => String(alert.status || "").toUpperCase() === "FAILED");
  const latestAlertTime = alerts[0]?.createdAt ? new Date(alerts[0].createdAt).toLocaleString() : "No alerts yet";
  const weatherFreshness = weather?.fetchedAt || weather?.createdAt
    ? new Date(weather.fetchedAt || weather.createdAt).toLocaleString()
    : "No weather pull yet";
  const providerModeLabel = providers?.smsProvider === "twilio"
    ? "Twilio SMS live"
    : providers?.notificationMode === "webhook"
      ? "Webhook mode"
      : "Mock mode";
  const lastUpdatedText = weather?.fetchedAt || weather?.createdAt
    ? new Date(weather.fetchedAt || weather.createdAt).toLocaleString()
    : "Not updated yet";
  const feelsLike = weather ? Math.round(Number(weather.temperature) + (Number(weather.humidity) / 100) * 2) : null;
  const rainChance = weather
    ? weather.condition?.toLowerCase().includes("rain")
      ? "72%"
      : weather.condition?.toLowerCase().includes("cloud")
        ? "38%"
        : "14%"
    : null;
  const windEstimate = weather
    ? weather.condition?.toLowerCase().includes("storm")
      ? "26 km/h"
      : weather.condition?.toLowerCase().includes("rain")
        ? "19 km/h"
        : "11 km/h"
    : null;

  if (!session) {
    return (
      <section className="dashboard-stack auth-landing">
        <div className="auth-hero-grid">
          <div className="panel hero-panel welcome-panel auth-hero-panel">
            <div className="auth-government-strip">
              <div className="auth-government-emblem">
                <img src={brandMark} alt="AgroAI Weather emblem" className="auth-government-logo" />
              </div>
              <div className="auth-government-copy">
                <span className="auth-government-kicker">Satyameva Jayate</span>
                <strong>BHARAT SARKAR</strong>
                <small>AgroAI Weather Operations Mission Control</small>
              </div>
            </div>

            <div className="welcome-brand">
              <img src={brandMark} alt="AgroAI Weather logo" className="welcome-logo" />
              <div>
                <p className="eyebrow">Agri Alert Stack</p>
                <h2>Weather operations that feel ready for real farmer outreach.</h2>
              </div>
            </div>

            <p className="welcome-copy">
              Track weather city by city, run AI analysis, prepare multilingual advisories, and send SMS or voice alerts from one calm operator workspace.
            </p>

            <div className="welcome-chip-row">
              <span className="welcome-chip">Realtime weather</span>
              <span className="welcome-chip">AI advisories</span>
              <span className="welcome-chip">SMS + Voice</span>
              <span className="welcome-chip">City targeting</span>
            </div>

            <div className="summary-mini-grid auth-mini-grid">
              <div className="mini-card auth-mini-card">
                <span>Coverage</span>
                <strong>City-wise monitoring</strong>
              </div>
              <div className="mini-card auth-mini-card">
                <span>Messaging</span>
                <strong>SMS and voice workflows</strong>
              </div>
              <div className="mini-card auth-mini-card">
                <span>Operators</span>
                <strong>Fast login and broadcast control</strong>
              </div>
            </div>

            <img src={heroScene} alt="Agriculture weather operations illustration" className="auth-hero-scene" />
          </div>

          <form className="panel auth-panel auth-card" onSubmit={submitAuth}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{authMode === "register" ? "Create Access" : "Welcome Back"}</p>
                <h2>{authMode === "register" ? "Register operator account" : "Start operator session"}</h2>
              </div>
            </div>

            <p className="muted auth-card-copy">
              {authMode === "register"
                ? "Create an operator login to manage farmer alerts and weather operations."
                : "Sign in to open the weather command center and start sending advisories."}
            </p>

            <div className="toggle-row auth-toggle-row">
              <button type="button" className={authMode === "login" ? "toggle-button active" : "toggle-button"} onClick={() => setAuthMode("login")}>Login</button>
              <button type="button" className={authMode === "register" ? "toggle-button active" : "toggle-button"} onClick={() => setAuthMode("register")}>Register</button>
            </div>

            <label>
              Username
              <input name="username" value={credentials.username} onChange={handleCredentialChange} required placeholder="Enter username" />
            </label>

            <label>
              Password
              <input type="password" name="password" value={credentials.password} onChange={handleCredentialChange} required placeholder="Enter password" />
            </label>

            <button className="primary-button auth-submit-button" type="submit" disabled={busyAction === "auth"}>
              {busyAction === "auth" ? "Working..." : authMode === "register" ? "Register and continue" : "Login"}
            </button>

            {error ? <p className="status error">{error}</p> : null}
            {message ? <p className="status success">{message}</p> : null}
          </form>
        </div>

        <div className="content-grid auth-info-grid">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">What This System Does</p>
                <h2>Core capabilities</h2>
              </div>
            </div>

            <div className="feature-grid">
              {welcomeHighlights.map((item) => (
                <article key={item.title} className="feature-card">
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">What To Do</p>
                <h2>Operator checklist</h2>
              </div>
            </div>

            <div className="playbook-list">
              {operatorSteps.map((step, index) => (
                <article key={step} className="playbook-item">
                  <span className="step-badge">0{index + 1}</span>
                  <p>{step}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-stack">
      <div className="summary-strip dashboard-command-strip">
        <div className="summary-card">
          <span>Total Farmers</span>
          <strong>{summary?.totalFarmers ?? 0}</strong>
        </div>
        <div className="summary-card">
          <span>Active Alerts</span>
          <strong>{alerts.length}</strong>
        </div>
        <div className="summary-card">
          <span>High Severity</span>
          <strong>{highPriorityAlerts.length}</strong>
        </div>
        <div className="summary-card">
          <span>Last Broadcast</span>
          <strong>{latestAlertTime}</strong>
        </div>
      </div>

      <div className="hero-grid">
        <div className="panel control-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Command Center</p>
              <h2>Overview operations hub</h2>
            </div>
          </div>

          <label>
            City
            <input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Nipani" />
          </label>

          <div className="button-row">
            <button className="primary-button" onClick={fetchLiveWeather} disabled={busyAction === "weather"}>
              {busyAction === "weather" ? "Fetching..." : "Fetch live weather"}
            </button>
            <button className="secondary-button" onClick={analyzeRisk} disabled={busyAction === "risk"}>
              {busyAction === "risk" ? "Analyzing..." : "Analyze risk"}
            </button>
          </div>

          {error ? <p className="status error">{error}</p> : null}
          {message ? <p className="status success">{message}</p> : null}

          <div className="dashboard-quick-actions">
            <button className="ghost-button" type="button" onClick={() => onNavigate?.("weather")}>
              Open Weather Monitor
            </button>
            <button className="ghost-button" type="button" onClick={() => onNavigate?.("broadcast")}>
              Open Broadcast Center
            </button>
            <button className="ghost-button" type="button" onClick={() => onNavigate?.("alerts")}>
              Open Live Alerts
            </button>
            <button className="ghost-button" type="button" onClick={() => onNavigate?.("farmers")}>
              Open Farmers
            </button>
          </div>
        </div>

        <div className="panel weather-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Live Snapshot</p>
              <h2>Weather control</h2>
            </div>
            <div className={`risk-badge ${String(risk?.severity || "low").toLowerCase()}`}>
              {risk ? `${risk.riskType} ${risk.severity}` : "Stable"}
            </div>
          </div>

          {weather ? (
            <>
              <div className="stat-grid">
                <div className="stat-card"><span>Region</span><strong>{weather.region}</strong></div>
                <div className="stat-card"><span>Condition</span><strong>{weather.condition}</strong></div>
                <div className="stat-card"><span>Temperature</span><strong>{weather.temperature} C</strong></div>
                <div className="stat-card"><span>Humidity</span><strong>{weather.humidity}%</strong></div>
              </div>

              <div className="summary-mini-grid live-snapshot-grid">
                <div className="mini-card"><span>Feels Like</span><strong>{feelsLike} C</strong></div>
                <div className="mini-card"><span>Rain Chance</span><strong>{rainChance}</strong></div>
                <div className="mini-card"><span>Wind</span><strong>{windEstimate}</strong></div>
                <div className="mini-card"><span>Last Updated</span><strong>{lastUpdatedText}</strong></div>
              </div>
            </>
          ) : (
            <p className="muted">Fetch a city to create the first advisory cycle.</p>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Urgency First</p>
            <h2>Operational status</h2>
          </div>
        </div>

        <div className="summary-mini-grid">
          <div className="mini-card">
            <span>Failed Deliveries</span>
            <strong>{failedDeliveries.length}</strong>
          </div>
          <div className="mini-card">
            <span>SMS Subscribers</span>
            <strong>{summary?.smsSubscribers ?? 0}</strong>
          </div>
          <div className="mini-card">
            <span>Voice Subscribers</span>
            <strong>{summary?.voiceSubscribers ?? 0}</strong>
          </div>
          <div className="mini-card">
            <span>Weather Freshness</span>
            <strong>{weatherFreshness}</strong>
          </div>
        </div>

        <div className="feature-grid dashboard-status-grid">
          <article className="feature-card">
            <strong>Monitored City</strong>
            <p>{region || "No region selected"} is the current command target.</p>
          </article>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel risk-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AI Assessment</p>
              <h2>Advisory signal</h2>
            </div>
          </div>

          {risk ? (
            <>
              <div className={`risk-badge ${risk.severity.toLowerCase()}`}>{risk.riskType} · {risk.severity}</div>
              <p>{risk.recommendation}</p>
            </>
          ) : (
            <p className="muted">Run analysis to generate the advisory that can feed the recipient preview.</p>
          )}
        </div>

        <div className="panel history-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Weather History</p>
              <h2>Recent pulls</h2>
            </div>
            <button className="ghost-button" onClick={() => loadDashboardData(region)}>Refresh list</button>
          </div>

          <div className="history-list">
            {history.length ? history.map((entry) => (
              <article key={entry.id} className="history-item">
                <div>
                  <strong>{entry.region}</strong>
                  <span>{entry.condition}</span>
                </div>
                <div>
                  <strong>{entry.temperature} C</strong>
                  <span>{new Date(entry.fetchedAt || entry.createdAt).toLocaleString()}</span>
                </div>
              </article>
            )) : <p className="muted">No records yet for this city.</p>}
          </div>
        </div>
      </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Broadcast Composer</p>
              <h2>AI or custom message</h2>
            </div>
          </div>

          <div className="toggle-row">
            <button
              type="button"
              className={composer.messageMode === "ai" ? "toggle-button active" : "toggle-button"}
              onClick={() => setComposer((current) => ({ ...current, messageMode: "ai" }))}
            >
              AI message
            </button>
            <button
              type="button"
              className={composer.messageMode === "custom" ? "toggle-button active" : "toggle-button"}
              onClick={() => setComposer((current) => ({ ...current, messageMode: "custom" }))}
            >
              Custom message
            </button>
          </div>

          {composer.messageMode === "custom" ? (
            <>
              <label>
                Custom broadcast language
                <select name="language" value={composer.language} onChange={handleComposerChange}>
                  <option value="mr">Marathi</option>
                  <option value="hi">Hindi</option>
                  <option value="en">English</option>
                </select>
              </label>

              <label>
                Operator recommendation
                <input
                  name="recommendation"
                  value={composer.recommendation}
                  onChange={handleComposerChange}
                  placeholder="Heavy rain expected. Protect harvested crop."
                />
              </label>

              <label>
                Custom message
                <textarea
                  name="customMessage"
                  value={composer.customMessage}
                  onChange={handleComposerChange}
                  rows="5"
                  placeholder="Farmers in Nipani, heavy rain expected in the next few hours..."
                />
              </label>
            </>
          ) : (
            <p className="muted">AI mode will generate farmer-wise messages using weather risk, crop, and language preferences.</p>
          )}

          <div className="checkbox-row">
            <label className="check-pill">
              <input type="checkbox" checked={composer.channels.includes("sms")} onChange={() => toggleChannel("sms")} />
              SMS
            </label>
            <label className="check-pill">
              <input type="checkbox" checked={composer.channels.includes("voice")} onChange={() => toggleChannel("voice")} />
              Voice Call
            </label>
            <label className="check-pill">
              <input type="checkbox" checked={composer.channels.includes("dashboard")} onChange={() => toggleChannel("dashboard")} />
              Dashboard Log
            </label>
          </div>

          <div className="button-row">
            <button className="secondary-button" onClick={previewAlert} disabled={busyAction === "preview"}>
              {busyAction === "preview" ? "Preparing..." : "Preview recipients"}
            </button>
            <button className="ghost-button" onClick={previewLanguages} disabled={busyAction === "language-preview"}>
              {busyAction === "language-preview" ? "Preparing..." : "Language preview"}
            </button>
            <button className="primary-button" onClick={sendAlert} disabled={busyAction === "alert"}>
              {busyAction === "alert" ? "Sending..." : "Send broadcast"}
            </button>
          </div>
        </div>


      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Language Preview</p>
            <h2>Marathi, Hindi, English</h2>
          </div>
        </div>

        <div className="feature-grid system-grid">
          {(languagePreview?.previews || []).map((item) => (
            <article key={item.language} className="feature-card">
              <strong>{item.language.toUpperCase()}</strong>
              <p>{item.message}</p>
            </article>
          ))}
          {!languagePreview ? (
            <article className="feature-card">
              <strong>Preview not generated</strong>
              <p>Use the Language preview button to see Marathi, Hindi, and English message output before sending.</p>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
