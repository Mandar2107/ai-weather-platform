import React, { useEffect, useState } from "react";
import { apiRequest } from "./api";

const initialForm = {
  name: "",
  phone: "+919686737219",
  city: "",
  village: "",
  taluka: "",
  district: "",
  state: "Maharashtra",
  cropType: "",
  landSizeAcres: "",
  irrigationType: "",
  language: "mr",
  smsEnabled: true,
  voiceEnabled: false,
  whatsappEnabled: false,
  notes: ""
};

const parseBooleanCell = (value, fallback) => {
  if (value === undefined || value === "") return fallback;
  return ["true", "yes", "1", "y"].includes(String(value).trim().toLowerCase());
};

const parseCsvRows = (text) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one farmer row");
  }

  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] || "";
    });

    return {
      name: row.name,
      phone: row.phone,
      city: row.city || row.region,
      village: row.village,
      taluka: row.taluka,
      district: row.district,
      state: row.state,
      cropType: row.cropType,
      landSizeAcres: row.landSizeAcres,
      irrigationType: row.irrigationType,
      language: row.language,
      smsEnabled: parseBooleanCell(row.smsEnabled, true),
      voiceEnabled: parseBooleanCell(row.voiceEnabled, false),
      whatsappEnabled: parseBooleanCell(row.whatsappEnabled, false),
      notes: row.notes
    };
  });
};

const Farmers = ({ session }) => {
  const [form, setForm] = useState(initialForm);
  const [csvFile, setCsvFile] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const token = session?.token;

  const loadFarmers = async () => {
    if (!token) return;

    const [farmerList, farmerSummary] = await Promise.all([
      apiRequest("/api/farmers", { token }).catch(() => []),
      apiRequest("/api/farmers/summary", { token }).catch(() => null)
    ]);

    setFarmers(Array.isArray(farmerList) ? farmerList : []);
    setSummary(farmerSummary);
  };

  useEffect(() => {
    loadFarmers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await apiRequest("/api/farmers", {
        method: "POST",
        token,
        body: {
          ...form,
          landSizeAcres: form.landSizeAcres ? Number(form.landSizeAcres) : 0
        }
      });
      setForm(initialForm);
      setShowAddModal(false);
      setMessage("Farmer enrolled successfully.");
      await loadFarmers();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!csvFile) {
      setError("Choose a CSV file first");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const text = await csvFile.text();
      const rows = parseCsvRows(text);
      const response = await apiRequest("/api/farmers/import", {
        method: "POST",
        token,
        body: { rows }
      });
      setMessage(response.message);
      setCsvFile(null);
      await loadFarmers();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const removeFarmer = async (id) => {
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/farmers/${id}`, { method: "DELETE", token });
      setMessage("Farmer removed.");
      await loadFarmers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (!session) {
    return (
      <section className="panel">
        <p className="eyebrow">Farmer Registry</p>
        <h2>Login from the dashboard to manage farmer enrollment.</h2>
      </section>
    );
  }

  return (
    <section className="dashboard-stack">
      {summary ? (
        <div className="summary-strip">
          <div className="summary-card"><span>Total Farmers</span><strong>{summary.totalFarmers}</strong></div>
          <div className="summary-card"><span>Marathi</span><strong>{summary.byLanguage.mr || 0}</strong></div>
          <div className="summary-card"><span>Hindi</span><strong>{summary.byLanguage.hi || 0}</strong></div>
          <div className="summary-card"><span>English</span><strong>{summary.byLanguage.en || 0}</strong></div>
        </div>
      ) : null}

      <div className="content-grid">
        <div className="panel farmer-form-launcher">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Enrollment</p>
              <h2>Farmer enrollment</h2>
            </div>
            <button className="primary-button" type="button" onClick={() => setShowAddModal(true)}>
              Add Farmer
            </button>
          </div>
          <p className="muted">Use the popup form to add one farmer quickly, or import many with CSV.</p>
          {error ? <p className="status error">{error}</p> : null}
          {message ? <p className="status success">{message}</p> : null}
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Bulk Import</p>
              <h2>Upload CSV</h2>
            </div>
          </div>

          <p className="muted">Use CSV to add many farmers at once.</p>
          <input type="file" accept=".csv" onChange={(event) => setCsvFile(event.target.files?.[0] || null)} />
          <button className="secondary-button import-button" type="button" onClick={handleImport} disabled={busy}>
            {busy ? "Importing..." : "Import farmers from CSV"}
          </button>

          <div className="history-list">
            <article className="history-item">
              <div>
                <strong>CSV Sample Headers</strong>
                <span>name,phone,city,village,taluka,district,state,cropType,landSizeAcres,irrigationType,language,smsEnabled,voiceEnabled,whatsappEnabled,notes</span>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Registry</p>
            <h2>Farmer list</h2>
          </div>
          <button className="ghost-button" onClick={loadFarmers}>Refresh</button>
        </div>

        <div className="history-list">
          {farmers.length ? farmers.map((farmer) => (
            <article key={farmer.id} className="history-item">
              <div>
                <strong>{farmer.name}</strong>
                <span>{farmer.city} · {farmer.cropType || "No crop"} · {farmer.language.toUpperCase()}</span>
                <span>{farmer.smsEnabled ? "SMS" : ""} {farmer.voiceEnabled ? "Voice" : ""}</span>
              </div>
              <div className="action-column">
                <strong>{farmer.phone}</strong>
                <button className="ghost-button" onClick={() => removeFarmer(farmer.id)}>Delete</button>
              </div>
            </article>
          )) : <p className="muted">No farmers enrolled yet.</p>}
        </div>
      </div>

      {showAddModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowAddModal(false)}>
          <div className="modal-panel farmer-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Enrollment</p>
                <h2>Add farmer</h2>
              </div>
              <button className="ghost-button" type="button" onClick={() => setShowAddModal(false)}>
                Close
              </button>
            </div>

            <form className="farmer-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label><span>Name</span><input name="name" value={form.name} onChange={handleChange} required /></label>
                <label><span>Phone</span><input name="phone" value={form.phone} onChange={handleChange} required /></label>
                <label><span>City</span><input name="city" value={form.city} onChange={handleChange} placeholder="Nipani" required /></label>
                <label><span>Village</span><input name="village" value={form.village} onChange={handleChange} /></label>
                <label><span>Taluka</span><input name="taluka" value={form.taluka} onChange={handleChange} /></label>
                <label><span>District</span><input name="district" value={form.district} onChange={handleChange} /></label>
                <label><span>Crop</span><input name="cropType" value={form.cropType} onChange={handleChange} placeholder="Sugarcane" /></label>
                <label><span>Land Size (Acres)</span><input name="landSizeAcres" type="number" min="0" step="0.1" value={form.landSizeAcres} onChange={handleChange} /></label>
                <label><span>Irrigation</span><input name="irrigationType" value={form.irrigationType} onChange={handleChange} placeholder="Drip" /></label>
                <label>
                  <span>Language</span>
                  <select name="language" value={form.language} onChange={handleChange}>
                    <option value="mr">Marathi</option>
                    <option value="hi">Hindi</option>
                    <option value="en">English</option>
                  </select>
                </label>
              </div>

              <label><span>Notes</span><textarea name="notes" value={form.notes} onChange={handleChange} rows="4" /></label>

              <div className="checkbox-row">
                <label className="check-pill"><input type="checkbox" name="smsEnabled" checked={form.smsEnabled} onChange={handleChange} />SMS</label>
                <label className="check-pill"><input type="checkbox" name="voiceEnabled" checked={form.voiceEnabled} onChange={handleChange} />Voice Call</label>
                <label className="check-pill"><input type="checkbox" name="whatsappEnabled" checked={form.whatsappEnabled} onChange={handleChange} />WhatsApp</label>
              </div>

              <div className="button-row">
                <button className="primary-button" type="submit" disabled={busy}>{busy ? "Saving..." : "Enroll farmer"}</button>
                <button className="ghost-button" type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Farmers;
