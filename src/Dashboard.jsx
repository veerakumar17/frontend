import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getRiskByLocation, getRecommendation, getDynamicPremiums, getPolicy, getPremiumHistory, getClaims } from "./api";
import Navbar from "./Navbar";
import "./Dashboard.css";

const POLL_INTERVAL = 30000;

const riskColor = { Low: "#22c55e", Medium: "#f59e0b", High: "#ef4444" };

const PLAN_BASE = {
  Basic:    { payout: 300  },
  Standard: { payout: 600  },
  Premium:  { payout: 1000 },
};

const TRIGGER_LABELS = {
  rainfall:    { label: "Heavy Rain"       },
  temperature: { label: "Extreme Heat"     },
  aqi:         { label: "Severe Pollution" },
  flood:       { label: "Flood Alert"      },
};

const DASH_CACHE_KEY = "dash_cache";

function toIST(utcStr) {
  if (!utcStr) return "";
  const ist = new Date(new Date(utcStr).getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(DASH_CACHE_KEY) || "null"); } catch { return null; }
}
function writeCache(data) {
  try { localStorage.setItem(DASH_CACHE_KEY, JSON.stringify(data)); } catch {}
}

export default function Dashboard() {
  const navigate = useNavigate();
  const worker   = JSON.parse(localStorage.getItem("worker") || "{}");
  const salary   = worker.weekly_salary;
  const location = worker.location;

  const cached = readCache();

  const [weather,      setWeather]      = useState(cached?.weather ?? null);
  const [risk,         setRisk]         = useState(cached?.risk ?? null);
  const [advice,       setAdvice]       = useState(null);
  const [dynPlans,     setDynPlans]     = useState(null);
  const [dynLoading,   setDynLoading]   = useState(false);
  const [dynError,     setDynError]     = useState("");
  const [policy,       setPolicy]       = useState(cached?.policy ?? null);
  const [premInfo,     setPremInfo]     = useState(cached?.premInfo ?? null);
  const [claims,       setClaims]       = useState(cached?.claims ?? []);
  const [toast,        setToast]        = useState(null);
  const [loading,      setLoading]      = useState(!cached);
  const [step,         setStep]         = useState("Fetching weather & risk data...");
  const [error,        setError]        = useState("");
  const knownClaimIds = useRef(new Set());

  useEffect(() => {
    if (!salary || !location) { navigate("/"); return; }
    fetchAll(!!cached);
  }, []);

  // Polling — checks for new auto-triggered claims every 30s
  useEffect(() => {
    if (!worker.id) return;
    const interval = setInterval(async () => {
      try {
        const clmRes = await getClaims(worker.id);
        const latest = clmRes.data;
        const newClaims = latest.filter(c => !knownClaimIds.current.has(c.id));
        if (newClaims.length > 0) {
          newClaims.forEach(c => knownClaimIds.current.add(c.id));
          setClaims(latest);
          writeCache({ ...readCache(), claims: latest });
          const last = newClaims[newClaims.length - 1];
          const label = TRIGGER_LABELS[last.trigger_type]?.label || last.trigger_type;
          setToast(`Auto-trigger fired! ${label} — Rs.${last.payout_amount} payout ${last.status}`);
          setTimeout(() => setToast(null), 5000);
        }
      } catch { /* silent */ }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [worker.id]);

  const fetchAll = async (silent = false) => {
    try {
      if (!silent) setStep("Fetching weather & risk data...");
      const riskRes  = await getRiskByLocation(location);
      const riskData = riskRes.data;
      const newWeather = riskData.features;
      const riskScore  = riskData.risk_score;
      const riskLevel  = riskData.risk_level;
      const newRisk    = { score: riskScore, level: riskLevel };
      setWeather(newWeather);
      setRisk(newRisk);
      localStorage.setItem("risk_score", riskScore);

      if (!silent) setStep("Loading your policy...");
      let newPolicy = null, newPremInfo = null, newClaims = [];
      try {
        const polRes  = await getPolicy(worker.id);
        newPolicy = polRes.data;
        setPolicy(newPolicy);
        const premRes = await getPremiumHistory(worker.id);
        newPremInfo = premRes.data;
        setPremInfo(newPremInfo);
        const clmRes  = await getClaims(worker.id);
        newClaims = clmRes.data;
        setClaims(newClaims);
        newClaims.forEach(c => knownClaimIds.current.add(c.id));
      } catch {
        // no policy yet
      }
      writeCache({ weather: newWeather, risk: newRisk, policy: newPolicy, premInfo: newPremInfo, claims: newClaims });
    } catch (err) {
      if (!silent) setError(err.response?.data?.detail || "Failed to load data. Check backend.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCalculateDynamic = async () => {
    setDynLoading(true);
    setDynError("");
    try {
      const riskScore = risk?.score ?? parseFloat(localStorage.getItem("risk_score") || "0.5");
      const dynRes  = await getDynamicPremiums(riskScore);
      setDynPlans(dynRes.data);
      const condition =
        weather?.temp     > 42  ? "Extreme Heat"     :
        weather?.rainfall > 70  ? "Heavy Rain"       :
        weather?.aqi      > 350 ? "Severe Pollution" : "Normal";
      const advRes = await getRecommendation(parseFloat(salary), riskScore, condition);
      setAdvice(advRes.data);
    } catch (err) {
      setDynError("Failed to calculate dynamic premiums.");
    } finally {
      setDynLoading(false);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="loading-screen">
        <div className="spinner" />
        <p>{step}</p>
      </div>
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div className="error-screen">
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Go Back</button>
      </div>
    </>
  );

  const weeksLeft = policy ? Math.max(0, 6 - policy.weeks_paid) : null;

  return (
    <div>
      <Navbar />
      <main className="dash-main">

        {/* ── Toast ── */}
        {toast && <div className="trig-toast">{toast}</div>}

        {/* ── Row 1: Profile / Weather / Risk ── */}
        <div className="cards-row">
          <div className="card">
            <h3>Your Profile</h3>
            <div className="card-row"><span>Name</span><strong>{worker.name}</strong></div>
            <div className="card-row"><span>Platform</span><strong>{worker.delivery_platform}</strong></div>
            <div className="card-row"><span>Location</span><strong>{location}</strong></div>
            <div className="card-row"><span>Weekly Salary</span><strong>₹{salary}</strong></div>
          </div>

          <div className="card">
            <h3>Live Weather</h3>
            <div className="card-row"><span>Temperature</span><strong>{weather?.temp}°C</strong></div>
            <div className="card-row"><span>Humidity</span><strong>{weather?.humidity}%</strong></div>
            <div className="card-row"><span>Rainfall</span><strong>{weather?.rainfall} mm</strong></div>
            <div className="card-row"><span>Wind Speed</span><strong>{weather?.wind} m/s</strong></div>
            <div className="card-row"><span>AQI</span><strong>{weather?.aqi}</strong></div>
          </div>

          <div className="card">
            <h3>Risk Assessment</h3>
            <div className="risk-score-circle" style={{ borderColor: riskColor[risk?.level] }}>
              <span className="risk-score-value">{risk?.score}</span>
              <span className="risk-score-label">Risk Score</span>
            </div>
            <div className="risk-badge" style={{ background: riskColor[risk?.level] }}>
              {risk?.level} Risk
            </div>
            {dynPlans && (
              <div className="risk-multiplier-note">
                Multiplier: ×{dynPlans.multiplier}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Active Policy Status ── */}
        {policy ? (
          <div className="policy-status-card">
            <div className="policy-status-header">
              <h3>Active Policy — {policy.plan} Plan</h3>
              <span className={`policy-badge ${policy.is_eligible ? "badge-active" : "badge-pending"}`}>
                {policy.is_eligible ? "Eligible for Claims" : `${policy.weeks_paid}/6 Weeks Paid`}
              </span>
            </div>
            <div className="policy-status-grid">
              <div className="ps-item">
                <span>Weekly Premium</span>
                <strong>₹{policy.weekly_premium}</strong>
              </div>
              <div className="ps-item">
                <span>Max Payout</span>
                <strong>₹{policy.max_payout}</strong>
              </div>
              <div className="ps-item">
                <span>Weeks Paid</span>
                <strong>{policy.weeks_paid} / 6</strong>
              </div>
              <div className="ps-item">
                <span>Next Payment</span>
                <strong>{policy.is_eligible ? "Auto-deducted weekly" : `Week ${policy.weeks_paid + 1}`}</strong>
              </div>
              <div className="ps-item">
                <span>Policy Status</span>
                <strong>{policy.status}</strong>
              </div>
              <div className="ps-item">
                <span>Total Claims</span>
                <strong>{claims.length}</strong>
              </div>
            </div>
            {!policy.is_eligible && (
              <div className="eligibility-bar-wrap">
                <div className="eligibility-bar-label">{weeksLeft} week{weeksLeft !== 1 ? "s" : ""} remaining to unlock claims</div>
                <div className="eligibility-bar-track">
                  <div className="eligibility-bar-fill" style={{ width: `${(policy.weeks_paid / 6) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-policy-banner">
            <div>
              <strong>No active policy</strong>
              <p>Choose a plan below to get started</p>
            </div>
          </div>
        )}

        {/* ── Row 3: Base Plans + Dynamic Premium Button ── */}
        <h2 className="section-title">Insurance Plans</h2>
        <div className="plans-row">
          {Object.entries({ Basic: { premium: 20, payout: 300 }, Standard: { premium: 35, payout: 600 }, Premium: { premium: 50, payout: 1000 } }).map(([planName, base]) => {
            const hasThisPlan = policy?.plan === planName;
            return (
              <div
                key={planName}
                className={`plan-card ${hasThisPlan ? "plan-active" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/plan/${planName}`)}
              >
                {hasThisPlan && <div className="active-plan-badge">Your Plan</div>}
                <div className="plan-name" style={{ color: "#2C85C5" }}>{planName}</div>
                <div className="plan-premium-row">
                  <span className="plan-premium">₹{base.premium}<span>/week</span></span>
                </div>
                <div className="plan-payout">Max Payout: <strong>₹{base.payout}</strong></div>
                <div className="plan-card-hint">View Details →</div>
              </div>
            );
          })}
        </div>

        {/* ── Dynamic Premium Calculation Button ── */}
        <div className="dyn-calc-section">
          <button className="dyn-calc-btn" onClick={handleCalculateDynamic} disabled={dynLoading}>
            {dynLoading ? "Calculating..." : "Calculate Dynamic Premium"}
          </button>
          <p className="dyn-calc-hint">Premiums are adjusted based on your delivery zone risk score ({risk?.level} Risk · ×{dynPlans?.multiplier ?? "?"})</p>
          {dynError && <div className="trig-error">{dynError}</div>}
        </div>

        {/* ── Dynamic Plans (shown after button click) ── */}
        {dynPlans && (
          <>
            <h2 className="section-title">Dynamic Pricing — Based on Your Risk</h2>
            <div className="dynamic-premium-note">
              Risk Level: <strong>{dynPlans.risk_level}</strong>
              &nbsp;·&nbsp; Multiplier: <strong>x{dynPlans.multiplier}</strong>
              &nbsp;·&nbsp; Base premiums adjusted based on your delivery zone risk
            </div>
            <div className="plans-row">
              {Object.entries(dynPlans.plans).map(([planName, details]) => {
                const isRecommended = advice?.recommended_plan === planName;
                const hasThisPlan   = policy?.plan === planName;
                return (
                  <div
                    key={planName}
                    className={`plan-card ${isRecommended ? "plan-recommended" : ""} ${hasThisPlan ? "plan-active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/plan/${planName}`)}
                  >
                    {isRecommended && <div className="recommended-badge">AI Recommended</div>}
                    {hasThisPlan   && <div className="active-plan-badge">Your Plan</div>}
                    <div className="plan-name" style={{ color: "#2C85C5" }}>{planName}</div>
                    <div className="plan-premium-row">
                      {details.base_premium !== details.final_premium && (
                        <span className="plan-base-strike">₹{details.base_premium}</span>
                      )}
                      <span className="plan-premium">₹{details.final_premium}<span>/week</span></span>
                    </div>
                    <div className="plan-payout">Max Payout: <strong>₹{details.max_payout}</strong></div>
                    <div className="plan-risk-tag" style={{ color: riskColor[details.risk_level] }}>
                      {details.risk_level} Risk Zone
                    </div>
                    <div className="plan-card-hint">View Details →</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Row 4: AI Advisor ── */}
        {dynPlans && advice && (
          <div className="advice-card">
            <div className="advice-header">
              <h3>AI Advisor Recommendation</h3>
            </div>
            <p className="advice-text">{advice.explanation}</p>
            <div className="advice-footer">
              <span>Recommended:</span>
              <strong>{advice.recommended_plan} Plan</strong>
              <span>· ₹{dynPlans?.plans[advice.recommended_plan]?.final_premium ?? advice.weekly_premium}/week · Max payout ₹{advice.max_payout}</span>
            </div>
          </div>
        )}

        {/* ── Row 5: Earnings Protection Summary ── */}
        {policy && (
          <div className="earnings-protection-card">
            <h2 className="section-title" style={{ marginBottom: 16 }}>Earnings Protection Summary</h2>
            <div className="ep-grid">
              <div className="ep-item ep-green">
                <span>Total Earnings Protected</span>
                <strong>₹{claims.filter(c => c.status === "Approved").reduce((s, c) => s + c.payout_amount, 0).toLocaleString("en-IN")}</strong>
              </div>
              <div className="ep-item">
                <span>Active Weekly Coverage</span>
                <strong>₹{policy.max_payout.toLocaleString("en-IN")}/week</strong>
              </div>
              <div className="ep-item">
                <span>Total Premiums Paid</span>
                <strong>₹{(policy.weeks_paid * policy.weekly_premium).toLocaleString("en-IN")}</strong>
              </div>
              <div className="ep-item">
                <span>Claims Approved</span>
                <strong>{claims.filter(c => c.status === "Approved").length}</strong>
              </div>
              <div className="ep-item">
                <span>Coverage Status</span>
                <strong style={{ color: policy.is_eligible ? "#16a34a" : "#d97706" }}>
                  {policy.is_eligible ? "Fully Active" : `${policy.weeks_paid}/6 weeks`}
                </strong>
              </div>
              <div className="ep-item">
                <span>Auto-Trigger</span>
                <strong style={{ color: "#2C85C5" }}>Live Monitoring</strong>
              </div>
            </div>
          </div>
        )}

        {/* ── Row 6: Payment History ── */}
        {policy && premInfo?.premiums?.length > 0 && (
          <>
            <h2 className="section-title">Payment History</h2>
            <div className="payment-history-list">
              {[...premInfo.premiums].reverse().map((p, i) => {
                const weekNum = p.week_number ?? (premInfo.premiums.length - i);
                const isPaid  = p.status === "paid";
                const date    = new Date(p.paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                return (
                  <div key={p.id} className={`payment-history-row ${isPaid ? "ph-paid" : "ph-failed"}`}>
                    <div className="ph-week-badge">Week {weekNum}</div>
                    <div className="ph-message">
                      {isPaid
                        ? `Week ${weekNum} premium of ₹${p.amount} detected and deducted from your account.`
                        : `Week ${weekNum} payment of ₹${p.amount} failed. Grace period initiated.`
                      }
                    </div>
                    <div className="ph-date">{date}</div>
                    <div className={`ph-status ${isPaid ? "ph-status-paid" : "ph-status-failed"}`}>
                      {isPaid ? "Paid" : "Failed"}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {policy && (!premInfo?.premiums || premInfo.premiums.length === 0) && (
          <>
            <h2 className="section-title">Payment History</h2>
            <div className="ph-empty">No payments detected yet. Admin will trigger your first weekly payment.</div>
          </>
        )}

        {/* ── Row 7: Claims History ── */}
        {policy && claims.length > 0 && (
          <>
            <h2 className="section-title">Claims History</h2>
            <div className="payment-history-list">
              {[...claims].reverse().map((c) => {
                const label = TRIGGER_LABELS[c.trigger_type]?.label || c.trigger_type;
                const date  = toIST(c.created_at);
                const isApproved = c.status === "Approved";
                const payoutProcessed = c.payout_status === "processed";
                return (
                  <div key={c.id} className={`payment-history-row ${isApproved ? "ph-paid" : "ph-failed"}`}>
                    <div className="ph-week-badge">{label}</div>
                    <div className="ph-message">
                      {isApproved
                        ? `${label} triggered — ₹${c.payout_amount} payout ${payoutProcessed ? "processed" : "pending"}`
                        : `${label} claim ${c.status.toLowerCase()}`
                      }
                      {payoutProcessed && c.payout_transaction_id && (
                        <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>
                          Txn: {c.payout_transaction_id}
                        </div>
                      )}
                    </div>
                    <div className="ph-date">{date}</div>
                    <div className={`ph-status ${isApproved ? "ph-status-paid" : "ph-status-failed"}`}>
                      {c.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </main>
    </div>
  );
}
