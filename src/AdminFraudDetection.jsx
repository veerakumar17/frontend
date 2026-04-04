import { useState, useEffect } from "react";
import { getFraudDetection } from "./api";
import Navbar from "./Navbar";
import "./AdminDashboard.css";

const RISK_COLOR  = { Low: "#16a34a", Medium: "#d97706", High: "#dc2626" };
const RISK_BG     = { Low: "rgba(34,197,94,0.1)", Medium: "rgba(245,158,11,0.1)", High: "rgba(239,68,68,0.1)" };
const ACTION_COLOR= { Allow: "#16a34a", Monitor: "#d97706", Block: "#dc2626" };

export default function AdminFraudDetection() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("All");

  useEffect(() => {
    getFraudDetection()
      .then(r => setData(r.data))
      .catch(() => setError("Failed to load fraud detection data."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? data : data.filter(d => d.risk_level === filter);

  const summary = {
    total:   data.length,
    high:    data.filter(d => d.risk_level === "High").length,
    medium:  data.filter(d => d.risk_level === "Medium").length,
    low:     data.filter(d => d.risk_level === "Low").length,
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
            <p>AI-powered rule-based fraud scoring for all workers. Detects abnormal claim patterns, rapid successive claims, repeated triggers and location mismatches.</p>
          </div>
        </div>

        <div className="adm-info-box">
          Fraud Score = Claim frequency (20) + Repeated trigger (30) + Rapid claims (40) + Location mismatch (30).
          &nbsp; Score 0–30: Allow &nbsp;·&nbsp; 30–70: Monitor &nbsp;·&nbsp; 70+: Block
        </div>

        {/* Summary KPIs */}
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
                <th>Claims This Month</th>
                <th>Fraud Score</th>
                <th>Risk Level</th>
                <th>Action</th>
                <th>Flags</th>
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
                      <span className="fraud-score-val" style={{ color: RISK_COLOR[w.risk_level] }}>
                        {w.fraud_score}
                      </span>
                    </td>
                    <td>
                      <span className="adm-risk-badge" style={{ background: RISK_COLOR[w.risk_level] }}>
                        {w.risk_level}
                      </span>
                    </td>
                    <td>
                      <span className="fraud-action-badge" style={{ color: ACTION_COLOR[w.action], background: RISK_BG[w.risk_level] }}>
                        {w.action}
                      </span>
                    </td>
                    <td>
                      {w.flags.length === 0
                        ? <span style={{ color: "#16a34a", fontSize: 12 }}>No flags</span>
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

        {/* Legend */}
        <div className="adm-info-box" style={{ marginTop: 8 }}>
          Detection rules: &nbsp;
          <strong>Abnormal frequency</strong> — 5+ claims/month (+20) &nbsp;·&nbsp;
          <strong>Repeated trigger</strong> — same trigger 3+ times (+30) &nbsp;·&nbsp;
          <strong>Rapid claims</strong> — claim within 1 hour of previous (+40) &nbsp;·&nbsp;
          <strong>Location mismatch</strong> — claims from different cities (+30)
        </div>

      </div>
    </div>
  );
}
