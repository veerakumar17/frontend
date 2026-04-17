import { useState, useEffect } from "react";
import { getFraudDetection } from "./api";
import Navbar from "./Navbar";
import "./AdminDashboard.css";

const RISK_COLOR   = { Low: "#16a34a", Medium: "#d97706", High: "#dc2626" };
const RISK_BG      = { Low: "rgba(34,197,94,0.1)", Medium: "rgba(245,158,11,0.1)", High: "rgba(239,68,68,0.1)" };
const ACTION_COLOR = { Allow: "#16a34a", Monitor: "#d97706", Block: "#dc2626" };

const SIGNALS = [
  { name: "Fake weather claim",            weight: "+50" },
  { name: "GPS / city spoofing",           weight: "+40" },
  { name: "Rapid successive claims",       weight: "+40" },
  { name: "Multi-city same day",           weight: "+35" },
  { name: "Repeated trigger",             weight: "+30" },
  { name: "ML anomaly (Isolation Forest)", weight: "+30" },
  { name: "High velocity (2+ / 7 days)",   weight: "+25" },
  { name: "Abnormal monthly frequency",    weight: "+20" },
];

const SCORE_BANDS = [
  { range: "0 – 29",  action: "Allow",   color: "#16a34a" },
  { range: "30 – 69", action: "Monitor", color: "#d97706" },
  { range: "70+",     action: "Block",   color: "#dc2626" },
];

const CACHE_KEY = "fraud_cache";
function readCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null"); } catch { return null; }
}
function writeCache(data) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

export default function AdminFraudDetection() {
  const cached = readCache();
  const [data,    setData]    = useState(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("All");

  useEffect(() => {
    if (cached) return; // already have data, skip fetch
    getFraudDetection()
      .then(r => { setData(r.data); writeCache(r.data); })
      .catch(() => setError("Failed to load fraud detection data."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? data : data.filter(d => d.risk_level === filter);

  const summary = {
    total:  data.length,
    high:   data.filter(d => d.risk_level === "High").length,
    medium: data.filter(d => d.risk_level === "Medium").length,
    low:    data.filter(d => d.risk_level === "Low").length,
  };

  if (loading) return (<><Navbar /><div className="adm-loading"><div className="spinner" /></div></>);
  if (error)   return (<><Navbar /><div className="adm-error">{error}</div></>);

  return (
    <div>
      <Navbar />
      <div className="adm-container">

        <div className="adm-header">
          <div>
            <h1>Fraud Detection</h1>
            <p>Advanced delivery-specific fraud detection — GPS spoofing, fake weather claims, claim velocity and behavioural anomalies.</p>
          </div>
        </div>

        {/* Signals + Score Bands — horizontal in one blue info box */}
        <div className="fraud-info-panel">
          <div className="fraud-signals-group">
            <div className="fraud-group-label">Fraud Signals</div>
            <div className="fraud-signals-list">
              {SIGNALS.map(s => (
                <div key={s.name} className="fraud-signal-item">
                  <span className="fraud-signal-name">{s.name}</span>
                  <span className="fraud-signal-weight">{s.weight}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fraud-divider" />

          <div className="fraud-bands-group">
            <div className="fraud-group-label">Score Bands</div>
            <div className="fraud-bands-list">
              {SCORE_BANDS.map(b => (
                <div key={b.range} className="fraud-band-item">
                  <span className="fraud-band-range">{b.range}</span>
                  <span className="fraud-band-action" style={{ color: b.color }}>{b.action}</span>
                </div>
              ))}
            </div>
            <p className="fraud-ml-note">
              Isolation Forest (scikit-learn) is trained on each worker's own claim history and flags statistically abnormal patterns.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="adm-kpi-grid" style={{ marginBottom: 24 }}>
          <div className="adm-kpi"><span>Total Workers</span><strong>{summary.total}</strong></div>
          <div className="adm-kpi adm-kpi-green"><span>Low Risk (Allow)</span><strong>{summary.low}</strong></div>
          <div className="adm-kpi adm-kpi-yellow"><span>Medium Risk (Monitor)</span><strong>{summary.medium}</strong></div>
          <div className="adm-kpi adm-kpi-red"><span>High Risk (Block)</span><strong>{summary.high}</strong></div>
        </div>

        {/* Filter */}
        <div className="adm-mode-toggle" style={{ marginBottom: 20 }}>
          {["All", "High", "Medium", "Low"].map(f => (
            <button
              key={f}
              className={`adm-mode-btn ${filter === f ? "adm-mode-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Location</th>
                <th>Plan</th>
                <th>Total Claims</th>
                <th>This Month</th>
                <th>Fraud Score</th>
                <th>Risk</th>
                <th>Action</th>
                <th>Fraud Signals Detected</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="adm-empty">No workers found.</td></tr>
              ) : (
                filtered.map(w => (
                  <tr key={w.worker_id}>
                    <td><strong>{w.worker_name}</strong></td>
                    <td>{w.location}</td>
                    <td>{w.plan}</td>
                    <td>{w.total_claims}</td>
                    <td>{w.claims_month}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: RISK_COLOR[w.risk_level] }}>
                        {w.fraud_score}
                      </span>
                    </td>
                    <td>
                      <span className="adm-risk-badge" style={{ background: RISK_COLOR[w.risk_level] }}>
                        {w.risk_level}
                      </span>
                    </td>
                    <td>
                      <span
                        className="fraud-action-badge"
                        style={{ color: ACTION_COLOR[w.action], background: RISK_BG[w.risk_level] }}
                      >
                        {w.action}
                      </span>
                    </td>
                    <td>
                      {w.flags.length === 0
                        ? <span style={{ color: "#16a34a", fontSize: 12 }}>No signals detected</span>
                        : (
                          <ul className="fraud-flags">
                            {w.flags.map((f, i) => <li key={i}>{f}</li>)}
                          </ul>
                        )
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
