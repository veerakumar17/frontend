import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAdminDashboard, getWorkersSummary, getSchedulerStatus } from "./api";
import Navbar from "./Navbar";
import "./AdminDashboard.css";

const RISK_COLOR = { Low: "#22c55e", Medium: "#f59e0b", High: "#ef4444" };

function toIST(utcStr) {
  if (!utcStr) return "";
  const d = new Date(utcStr);
  // Add 5h 30m for IST
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}

const ADM_CACHE_KEY = "adm_dash_cache";
function readAdmCache() {
  try { return JSON.parse(localStorage.getItem(ADM_CACHE_KEY) || "null"); } catch { return null; }
}
function writeAdmCache(data) {
  try { localStorage.setItem(ADM_CACHE_KEY, JSON.stringify(data)); } catch {}
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const cached   = readAdmCache();
  const [data,      setData]      = useState(cached?.data ?? null);
  const [workers,   setWorkers]   = useState(cached?.workers ?? []);
  const [loading,   setLoading]   = useState(!cached);
  const [error,     setError]     = useState("");
  const [tab,       setTab]       = useState(() => new URLSearchParams(location.search).get("tab") || "overview");
  const [schedInfo, setSchedInfo] = useState(null);

  useEffect(() => {
    const silent = !!cached;
    Promise.all([getAdminDashboard(), getWorkersSummary(), getSchedulerStatus()])
      .then(([d, w, s]) => {
        setData(d.data);
        setWorkers(w.data);
        setSchedInfo(s.data);
        writeAdmCache({ data: d.data, workers: w.data });
      })
      .catch(() => { if (!silent) setError("Failed to load admin data."); })
      .finally(() => { if (!silent) setLoading(false); });
  }, []);

  if (loading) return (<><Navbar /><div className="adm-loading"><div className="spinner" /></div></>);
  if (error)   return (<><Navbar /><div className="adm-error">{error}</div></>);

  const { overview, claims_by_trigger, weekly_trend, city_risk_forecast, estimated_next_week_exposure } = data;

  return (
    <div>
      <Navbar />
      <div className="adm-container">

        <div className="adm-header">
          <div>
            <h1>Insurer Dashboard</h1>
            <p>Real-time analytics, loss ratios and predictive disruption forecasts</p>
          </div>
          {schedInfo && (
            <div className="adm-sched-status">
              <span>Auto-trigger runs every 5 minutes</span>
              {schedInfo.last_run
                ? <span>Last run: {toIST(schedInfo.last_run)} · {schedInfo.claims_created} claims · {schedInfo.payouts_processed} payouts</span>
                : <span>Not yet run</span>
              }
            </div>
          )}
        </div>

        <div className="adm-tabs">
          {["overview", "forecast", "workers"].map(t => (
            <button key={t} className={`adm-tab ${tab === t ? "adm-tab-active" : ""}`} onClick={() => setTab(t)}>
              {t === "overview" ? "Overview" : t === "forecast" ? "Forecast" : "Workers"}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <div className="adm-kpi-grid">
              <div className="adm-kpi"><span>Total Workers</span><strong>{overview.total_workers}</strong></div>
              <div className="adm-kpi"><span>Active Policies</span><strong>{overview.active_policies}</strong></div>
              <div className="adm-kpi"><span>Eligible for Claims</span><strong>{overview.eligible_policies}</strong></div>
              <div className="adm-kpi adm-kpi-green"><span>Premiums Collected</span><strong>Rs.{overview.total_premium_collected.toLocaleString("en-IN")}</strong></div>
              <div className="adm-kpi adm-kpi-red"><span>Total Payouts</span><strong>Rs.{overview.total_payout.toLocaleString("en-IN")}</strong></div>
              <div className={`adm-kpi ${overview.loss_ratio_percent > 70 ? "adm-kpi-red" : overview.loss_ratio_percent > 40 ? "adm-kpi-yellow" : "adm-kpi-green"}`}>
                <span>Loss Ratio</span>
                <strong>{overview.loss_ratio_percent}%</strong>
                <small>{overview.loss_ratio_percent > 70 ? "High" : overview.loss_ratio_percent > 40 ? "Moderate" : "Healthy"}</small>
              </div>
              <div className="adm-kpi"><span>Total Claims</span><strong>{overview.total_claims}</strong></div>
              <div className="adm-kpi adm-kpi-green"><span>Approved Claims</span><strong>{overview.approved_claims}</strong></div>
            </div>

            <div className="adm-info-box">
              Loss Ratio = Total Payouts / Total Premiums x 100 &nbsp;·&nbsp;
              Current: <strong style={{ color: overview.loss_ratio_percent > 70 ? "#ef4444" : "#22c55e" }}>{overview.loss_ratio_percent}%</strong>
              &nbsp;·&nbsp; Healthy range: &lt;60%
            </div>

            <h2 className="adm-section-title">Claims by Trigger Type</h2>
            <div className="adm-trigger-grid">
              {Object.entries(claims_by_trigger).filter(([type]) => type !== "worker_inactivity").length === 0
                ? <p className="adm-empty">No approved claims yet.</p>
                : Object.entries(claims_by_trigger)
                    .filter(([type]) => type !== "worker_inactivity")
                    .map(([type, count]) => (
                      <div key={type} className="adm-trigger-card">
                        <span className="adm-trigger-label">{type.replace("_", " ")}</span>
                        <strong className="adm-trigger-count">{count}</strong>
                      </div>
                    ))
              }
            </div>

            <h2 className="adm-section-title">Weekly Trend (Last 4 Weeks)</h2>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th>Period</th><th>Claims</th><th>Payouts (Rs.)</th><th>Premiums (Rs.)</th><th>Loss Ratio</th></tr>
                </thead>
                <tbody>
                  {weekly_trend.map((w, i) => {
                    const lr = w.premiums > 0 ? ((w.payout / w.premiums) * 100).toFixed(1) : "—";
                    return (
                      <tr key={i}>
                        <td>{w.week}</td>
                        <td>{w.claims}</td>
                        <td>Rs.{w.payout.toLocaleString("en-IN")}</td>
                        <td>Rs.{w.premiums.toLocaleString("en-IN")}</td>
                        <td style={{ color: parseFloat(lr) > 70 ? "#ef4444" : "#22c55e" }}>{lr}{lr !== "—" ? "%" : ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "forecast" && (
          <>
            <div className="adm-exposure-banner">
              <div>
                <strong>Estimated Next-Week Payout Exposure</strong>
                <p>Based on current weather conditions in high-risk cities</p>
              </div>
              <div className="adm-exposure-amount">Rs.{estimated_next_week_exposure.toLocaleString("en-IN")}</div>
            </div>

            <h2 className="adm-section-title">City-wise Risk Forecast (Live Weather)</h2>
            {city_risk_forecast.length === 0
              ? <p className="adm-empty">No city data available.</p>
              : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>City</th><th>Risk Level</th><th>Risk Score</th><th>Temp (C)</th><th>Rainfall (mm)</th><th>AQI</th><th>Workers</th></tr>
                    </thead>
                    <tbody>
                      {city_risk_forecast.map((c, i) => (
                        <tr key={i}>
                          <td><strong>{c.city}</strong></td>
                          <td><span className="adm-risk-badge" style={{ background: RISK_COLOR[c.risk_level] }}>{c.risk_level}</span></td>
                          <td>{c.risk_score}</td>
                          <td>{c.temp ?? "—"}</td>
                          <td>{c.rainfall ?? "—"}</td>
                          <td>{c.aqi ?? "—"}</td>
                          <td>{c.workers_affected}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
            <div className="adm-info-box" style={{ marginTop: 16 }}>
              Live weather and AQI data is fetched for each worker's city. The ML model predicts disruption risk. High-risk cities with eligible policies contribute to the exposure estimate.
            </div>
          </>
        )}

        {tab === "workers" && (
          <>
            <h2 className="adm-section-title">All Workers</h2>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th>Name</th><th>Location</th><th>Platform</th><th>Plan</th><th>Weeks Paid</th><th>Eligible</th><th>Claims</th><th>Payout (Rs.)</th><th>Premium Paid (Rs.)</th></tr>
                </thead>
                <tbody>
                  {workers.map((w) => (
                    <tr key={w.id}>
                      <td><strong>{w.name}</strong></td>
                      <td>{w.location}</td>
                      <td>{w.platform}</td>
                      <td>{w.plan ?? "—"}</td>
                      <td>{w.weeks_paid}/6</td>
                      <td style={{ color: w.is_eligible ? "#22c55e" : "#f59e0b" }}>{w.is_eligible ? "Yes" : "No"}</td>
                      <td>{w.total_claims}</td>
                      <td>Rs.{w.total_payout.toLocaleString("en-IN")}</td>
                      <td>Rs.{w.premium_paid.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
