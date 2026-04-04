import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDynamicPremiums, createPolicy, payPremium, getPolicy, getPremiumHistory } from "./api";
import Navbar from "./Navbar";
import "./PlanDetail.css";

const PLAN_META = {
  Basic: {
    benefits: [
      "Coverage against heavy rainfall (>70mm)",
      "Coverage against extreme heat (>42°C)",
      "Auto-claim processing — no paperwork",
      "UPI/bank direct payout within 24 hours",
      "2-day grace period on missed payments",
    ],
  },
  Standard: {
    benefits: [
      "All Basic plan benefits",
      "Coverage against AQI >350 (severe pollution)",
      "Coverage against flood alerts (>120mm)",
      "Priority claim processing",
      "SMS & email notifications for triggers",
    ],
  },
  Premium: {
    benefits: [
      "All Standard plan benefits",
      "Highest payout — ₹1,000/week",
      "Dedicated support agent",
      "Instant payout on claim approval",
      "Coverage for all 4 trigger types simultaneously",
    ],
  },
};

const riskColor = { Low: "#22c55e", Medium: "#f59e0b", High: "#ef4444" };

const DASH_CACHE_KEY = "dash_cache";
function readDashCache() {
  try { return JSON.parse(localStorage.getItem(DASH_CACHE_KEY) || "null"); } catch { return null; }
}
function writeDashCache(patch) {
  try {
    const prev = JSON.parse(localStorage.getItem(DASH_CACHE_KEY) || "null") || {};
    localStorage.setItem(DASH_CACHE_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch {}
}

export default function PlanDetail() {
  const { planName } = useParams();
  const navigate     = useNavigate();
  const worker       = JSON.parse(localStorage.getItem("worker") || "{}");
  const meta         = PLAN_META[planName];
  const cached       = readDashCache();

  const [dynDetails, setDynDetails] = useState(null);
  const [policy,     setPolicy]     = useState(cached?.policy ?? null);
  const [premInfo,   setPremInfo]   = useState(cached?.premInfo ?? null);
  const [loading,    setLoading]    = useState(true);
  const [payMode,    setPayMode]    = useState(null);
  const [paying,     setPaying]     = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  useEffect(() => {
    if (!meta) return;
    init();
  }, [planName]);

  const init = async () => {
    setError("");
    try {
      const riskScore = parseFloat(localStorage.getItem("risk_score") || "0.5");
      const dynRes    = await getDynamicPremiums(riskScore);
      setDynDetails(dynRes.data.plans[planName]);

      // only fetch policy/premInfo if not already in cache
      if (!cached?.policy) {
        try {
          const polRes  = await getPolicy(worker.id);
          setPolicy(polRes.data);
          writeDashCache({ policy: polRes.data });
          const premRes = await getPremiumHistory(worker.id);
          setPremInfo(premRes.data);
          writeDashCache({ premInfo: premRes.data });
        } catch { /* no policy yet */ }
      }
    } catch (err) {
      setError("Failed to load plan details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    setCreating(true);
    setError("");
    try {
      const riskScore = parseFloat(localStorage.getItem("risk_score") || "0.5");
      const res = await createPolicy(worker.id, planName, riskScore);
      setPolicy(res.data);
      writeDashCache({ policy: res.data });
      setSuccess("Policy created! Now complete 6 weekly payments to activate coverage.");
      setPayMode("weekly");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create policy.");
    } finally {
      setCreating(false);
    }
  };

  const handlePayWeek = async () => {
    if (paying) return;
    setPaying(true);
    setError("");
    setSuccess("");
    try {
      await payPremium(worker.id);
      const polRes  = await getPolicy(worker.id);
      setPolicy(polRes.data);
      writeDashCache({ policy: polRes.data });
      const premRes = await getPremiumHistory(worker.id);
      setPremInfo(premRes.data);
      writeDashCache({ premInfo: premRes.data });
      const paid = polRes.data.weeks_paid;
      if (polRes.data.is_eligible) {
        setSuccess("All 6 weeks paid! You are now eligible for claims.");
      } else {
        setSuccess(`Week ${paid} payment successful! ${6 - paid} week${6 - paid !== 1 ? "s" : ""} remaining.`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Payment failed.");
    } finally {
      setPaying(false);
    }
  };

  if (!meta) return (
    <>
      <Navbar />
      <div className="pd-not-found">
        <p>Plan not found.</p>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>
    </>
  );

  if (loading) return (
    <>
      <Navbar />
      <div className="pd-not-found"><div className="spinner" /></div>
    </>
  );

  const paidCount  = policy?.weeks_paid ?? 0;
  const isEligible = policy?.is_eligible ?? false;
  const hasPlan    = policy?.plan === planName;
  const hasDiffPlan = policy && policy.plan !== planName;

  const weeks = Array(6).fill(null).map((_, i) => {
    if (i < paidCount) return "paid";
    if (i === paidCount && !isEligible) return "pending";
    return "locked";
  });

  return (
    <>
      <Navbar />
      <div className="pd-container">

        <div className="pd-header">
          <button className="pd-back" onClick={() => navigate("/dashboard")}>← Back to Dashboard</button>
          <h1 className="pd-title">{planName} Plan</h1>
          <p className="pd-subtitle">Review your plan details and complete payment to activate coverage</p>
        </div>

        <div className="pd-grid">

          {/* ── Left: Plan Details ── */}
          <div className="pd-left">
            <div className="pd-card">
              <h2 className="pd-card-title">Plan Overview</h2>
              {dynDetails && (
                <>
                  <div className="pd-detail-row">
                    <span>Plan Name</span>
                    <strong>{planName}</strong>
                  </div>
                  <div className="pd-detail-row">
                    <span>Base Premium</span>
                    <strong>₹{dynDetails.base_premium}/week</strong>
                  </div>
                  <div className="pd-detail-row">
                    <span>Risk Level</span>
                    <strong style={{ color: riskColor[dynDetails.risk_level] }}>
                      {dynDetails.risk_level} Risk
                    </strong>
                  </div>
                  <div className="pd-detail-row">
                    <span>Risk Multiplier</span>
                    <strong>×{dynDetails.multiplier}</strong>
                  </div>
                  <div className="pd-detail-row pd-highlight-row">
                    <span>Final Weekly Premium</span>
                    <strong className="pd-final-premium">₹{dynDetails.final_premium}/week</strong>
                  </div>
                  <div className="pd-detail-row">
                    <span>Max Weekly Payout</span>
                    <strong>₹{dynDetails.max_payout}</strong>
                  </div>
                  <div className="pd-detail-row">
                    <span>Eligibility Period</span>
                    <strong>6 Weeks</strong>
                  </div>
                  <div className="pd-detail-row">
                    <span>Total to Pay</span>
                    <strong>₹{(dynDetails.final_premium * 6).toFixed(2)}</strong>
                  </div>
                  <div className="pd-premium-formula">
                    Formula: ₹{dynDetails.base_premium} × {dynDetails.multiplier} = <strong>₹{dynDetails.final_premium}/week</strong>
                  </div>
                </>
              )}
              <div className="pd-eligibility">
                Coverage activates from Week 7 onwards after 6 consecutive premium payments
              </div>
            </div>

            <div className="pd-card">
              <h2 className="pd-card-title">Benefits</h2>
              <ul className="pd-benefits">
                {meta.benefits.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          </div>

          {/* ── Right: Payment ── */}
          <div className="pd-right">
            <div className="pd-card">
              <h2 className="pd-card-title">Payment & Activation</h2>

              {error   && <div className="pd-error">{error}</div>}
              {success && <div className="pd-success-msg">{success}</div>}

              {/* Already has a different plan */}
              {hasDiffPlan && (
                <div className="pd-info-box">
                  You already have an active <strong>{policy.plan}</strong> plan.
                  Only one policy per worker is allowed.
                </div>
              )}

              {/* No policy yet — offer to create */}
              {!policy && !hasDiffPlan && (
                <div className="pd-create-section">
                  <div className="pd-amount-box">
                    <span>Dynamic Weekly Premium</span>
                    <strong>₹{dynDetails?.final_premium}/week</strong>
                  </div>
                  <p className="pd-create-note">
                    Once you activate this plan, the admin will trigger your weekly payments.
                    Premium is adjusted based on your <strong>{dynDetails?.risk_level} Risk</strong> zone.
                  </p>
                  <button className="pd-confirm-btn" onClick={handleCreatePolicy} disabled={creating}>
                    {creating ? "Creating Policy..." : `Activate ${planName} Plan`}
                  </button>
                </div>
              )}

              {/* Has this plan — show weekly payment tracker */}
              {hasPlan && (
                <>
                  <div className="pd-progress-bar-wrap">
                    <div className="pd-progress-label">{paidCount} / 6 weeks completed</div>
                    <div className="pd-progress-track">
                      <div className="pd-progress-fill" style={{ width: `${Math.min((paidCount / 6) * 100, 100)}%` }} />
                    </div>
                  </div>

                  {/* Payment history table */}
                  <div className="pd-weeks-grid">
                    <table className="pd-payment-table">
                      <thead>
                        <tr>
                          <th>Week</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {premInfo?.premiums?.length > 0 ? (
                          premInfo.premiums.map((p, i) => (
                            <tr key={p.id}>
                              <td><strong>Week {p.week_number ?? i + 1}</strong></td>
                              <td>Rs.{p.amount}</td>
                              <td style={{ color: p.status === "paid" ? "#16a34a" : "#dc2626", fontWeight: 600, textTransform: "capitalize" }}>
                                {p.status}
                              </td>
                              <td>{new Date(p.paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} style={{ color: "var(--text2)", fontSize: 13 }}>No payments yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {!isEligible && (
                    <div className="pd-info-box">
                      Waiting for admin to trigger Week {paidCount + 1} payment.
                    </div>
                  )}

                  {isEligible && (
                    <div className="pd-eligible-msg">
                      You are fully eligible for claims!<br />
                      Coverage is active from this week onwards.
                    </div>
                  )}

                  <div className="pd-policy-meta">
                    <span>Policy ID: #{policy.id}</span>
                    <span>Status: {policy.status}</span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
