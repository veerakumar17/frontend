import { useState, useEffect } from "react";
import { getWorkersSummary, adminFireTriggerLocation, adminTriggerPayment } from "./api";
import Navbar from "./Navbar";
import "./AdminDashboard.css";

export default function AdminTriggers() {
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");

  const [workers,    setWorkers]    = useState([]);
  const [locations,  setLocations]  = useState([]);
  const [mode,       setMode]       = useState("location"); // "location" | "worker"
  const [location,   setLocation]   = useState("");
  const [workerId,   setWorkerId]   = useState("");
  const [firing,     setFiring]     = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState("");

  useEffect(() => {
    getWorkersSummary().then(r => {
      setWorkers(r.data);
      const unique = [...new Set(r.data.filter(w => w.plan).map(w => w.location))];
      setLocations(unique);
    }).catch(() => {});
  }, []);

  const reset = () => { setResult(null); setError(""); };

  const workersInLocation  = workers.filter(w => w.location === location);
  const eligibleInLocation = workersInLocation.filter(w => w.is_eligible);
  const eligibleWorkers    = workers.filter(w => w.is_eligible);
  const selectedWorker     = workers.find(w => String(w.id) === String(workerId));

  const handleFire = async (e) => {
    e.preventDefault();
    reset();

    if (mode === "location") {
      if (!location)                        { setError("Select a location."); return; }
      if (eligibleInLocation.length === 0)  { setError("No eligible workers in this location."); return; }
      setFiring(true);
      try {
        const res = await adminFireTriggerLocation({ location, admin_name: admin.name || "Admin" });
        setResult({ type: "location", data: res.data });
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to fire trigger.");
      } finally { setFiring(false); }

    } else {
      if (!workerId)       { setError("Select a worker."); return; }
      if (!selectedWorker?.is_eligible) { setError("Selected worker is not eligible for claims."); return; }
      setFiring(true);
      try {
        // fire trigger for individual worker via location (their city)
        const res = await adminFireTriggerLocation({
          location: selectedWorker.location,
          admin_name: admin.name || "Admin",
          worker_id: parseInt(workerId),
        });
        setResult({ type: "worker", worker: selectedWorker, data: res.data });
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to fire trigger.");
      } finally { setFiring(false); }
    }
  };

  return (
    <div>
      <Navbar />
      <div className="adm-container">
        <div className="adm-header">
          <div>
            <h1>Fire Disruption Trigger</h1>
            <p>Select a location or individual worker. The system fetches live weather and AQI, detects which thresholds are exceeded, and automatically creates claims.</p>
          </div>
        </div>

        <div className="adm-info-box">
          The trigger type is determined automatically from live weather data — no manual selection needed.
          All eligible workers in the selected location receive a claim instantly.
        </div>

        {/* Mode Toggle */}
        <div className="adm-mode-toggle">
          <button
            className={`adm-mode-btn ${mode === "location" ? "adm-mode-active" : ""}`}
            onClick={() => { setMode("location"); reset(); }}
          >
            By Location
          </button>
          <button
            className={`adm-mode-btn ${mode === "worker" ? "adm-mode-active" : ""}`}
            onClick={() => { setMode("worker"); reset(); }}
          >
            Individual Worker
          </button>
        </div>

        <div className="adm-trigger-form-card">
          <form onSubmit={handleFire} className="adm-trigger-form">

            {mode === "location" ? (
              <div className="adm-form-group">
                <label>Select Location</label>
                <select value={location} onChange={e => { setLocation(e.target.value); reset(); }}>
                  <option value="">— Select location —</option>
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                {locations.length === 0 && (
                  <small className="adm-form-hint">No workers with active policies found.</small>
                )}
                {location && (
                  <div className="adm-location-preview">
                    <div className="adm-location-stat">
                      <span>Total workers in {location}</span>
                      <strong>{workersInLocation.length}</strong>
                    </div>
                    <div className="adm-location-stat">
                      <span>Eligible for claims</span>
                      <strong style={{ color: eligibleInLocation.length > 0 ? "#16a34a" : "#f59e0b" }}>
                        {eligibleInLocation.length}
                      </strong>
                    </div>
                    {eligibleInLocation.length > 0 && (
                      <div className="adm-location-workers">
                        {eligibleInLocation.map(w => (
                          <span key={w.id} className="adm-worker-tag">{w.name} ({w.plan})</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="adm-form-group">
                <label>Select Worker</label>
                <select value={workerId} onChange={e => { setWorkerId(e.target.value); reset(); }}>
                  <option value="">— Select worker —</option>
                  {eligibleWorkers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} — {w.location} ({w.plan} Plan)
                    </option>
                  ))}
                </select>
                {eligibleWorkers.length === 0 && (
                  <small className="adm-form-hint">No eligible workers found.</small>
                )}
                {selectedWorker && (
                  <div className="adm-location-preview">
                    <div className="adm-location-stat"><span>Name</span><strong>{selectedWorker.name}</strong></div>
                    <div className="adm-location-stat"><span>Location</span><strong>{selectedWorker.location}</strong></div>
                    <div className="adm-location-stat"><span>Plan</span><strong>{selectedWorker.plan}</strong></div>
                    <div className="adm-location-stat"><span>Status</span><strong style={{ color: "#16a34a" }}>Eligible ✅</strong></div>
                  </div>
                )}
              </div>
            )}

            {error  && <div className="adm-action-msg adm-msg-err">{error}</div>}

            {result && (
              <div className="adm-action-msg adm-msg-ok">
                <strong>Triggers detected in {result.data.location}:</strong> {result.data.triggers_detected.join(", ")}
                <br />
                <strong>{result.data.claims_created}</strong> claim{result.data.claims_created !== 1 ? "s" : ""} created
                {result.type === "worker" && ` for ${result.worker.name}`}:
                {result.data.details.map((d, i) => (
                  <span key={i} className="adm-result-detail"> {d.worker} ({d.trigger} — Rs.{d.payout})</span>
                ))}
              </div>
            )}

            <button type="submit" className="adm-fire-btn" disabled={firing || (mode === "location" ? !location : !workerId)}>
              {firing ? "Checking weather and firing..." : "Check Weather and Fire Trigger"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
