import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./PlanDetail.css";

const PLAN_DATA = {
  Basic: {
    name: "Basic",
    color: "#2C85C5",
    coverage: 50000,
    weeklyPremium: 20,
    totalWeeks: 6,
    benefits: [
      "Coverage against heavy rainfall (>70mm)",
      "Coverage against extreme heat (>42°C)",
      "Auto-claim processing — no paperwork",
      "UPI/bank direct payout within 24 hours",
      "2-day grace period on missed payments",
    ],
  },
  Standard: {
    name: "Standard",
    color: "#2C85C5",
    coverage: 100000,
    weeklyPremium: 35,
    totalWeeks: 6,
    benefits: [
      "All Basic plan benefits",
      "Coverage against AQI >350 (severe pollution)",
      "Coverage against flood alerts",
      "Priority claim processing",
      "SMS & email notifications for triggers",
    ],
  },
  Premium: {
    name: "Premium",
    color: "#2C85C5",
    coverage: 200000,
    weeklyPremium: 50,
    totalWeeks: 6,
    benefits: [
      "All Standard plan benefits",
      "Highest payout — ₹1,000/week",
      "Dedicated support agent",
      "Instant payout on claim approval",
      "Coverage for all 4 trigger types simultaneously",
    ],
  },
};

export default function PlanDetail() {
  const { planName } = useParams();
  const navigate = useNavigate();
  const plan = PLAN_DATA[planName];

  const [payMode, setPayMode] = useState(null);
  const [weeks, setWeeks] = useState(Array(6).fill("locked").fill("pending", 0, 1));
  const [paying, setPaying] = useState(false);
  const [fullPaid, setFullPaid] = useState(false);
  const [fullPaying, setFullPaying] = useState(false);

  if (!plan) {
    return (
      <>
        <Navbar />
        <div className="pd-not-found">
          <p>Plan not found.</p>
          <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </>
    );
  }

  const totalPayable = plan.weeklyPremium * plan.totalWeeks;
  const paidCount = weeks.filter((w) => w === "paid").length;
  const allPaid = paidCount === plan.totalWeeks;

  const currentPendingIndex = weeks.findIndex((w) => w === "pending");

  const handleWeekPay = () => {
    if (currentPendingIndex === -1 || paying) return;
    setPaying(true);
    setTimeout(() => {
      setWeeks((prev) => {
        const updated = [...prev];
        updated[currentPendingIndex] = "paid";
        if (currentPendingIndex + 1 < plan.totalWeeks) {
          updated[currentPendingIndex + 1] = "pending";
        }
        return updated;
      });
      setPaying(false);
    }, 1200);
  };

  const handleFullPay = () => {
    setFullPaying(true);
    setTimeout(() => {
      setFullPaid(true);
      setFullPaying(false);
    }, 1500);
  };

  const weekLabel = (status, i) => {
    if (status === "paid") return { icon: "✅", label: "Paid", cls: "week-paid" };
    if (status === "pending") return { icon: "⏳", label: "Pending", cls: "week-pending" };
    return { icon: "🔒", label: "Locked", cls: "week-locked" };
  };

  return (
    <>
      <Navbar />
      <div className="pd-container">

        {/* Header */}
        <div className="pd-header">
          <button className="pd-back" onClick={() => navigate("/dashboard")}>← Back</button>
          <h1 className="pd-title">{plan.name} Plan</h1>
          <p className="pd-subtitle">Review your plan details and complete payment to activate coverage</p>
        </div>

        <div className="pd-grid">

          {/* Left: Plan Details */}
          <div className="pd-left">
            <div className="pd-card">
              <h2 className="pd-card-title">Plan Overview</h2>
              <div className="pd-detail-row"><span>Plan Name</span><strong>{plan.name}</strong></div>
              <div className="pd-detail-row"><span>Coverage Amount</span><strong>₹{plan.coverage.toLocaleString()}</strong></div>
              <div className="pd-detail-row"><span>Weekly Premium</span><strong>₹{plan.weeklyPremium}</strong></div>
              <div className="pd-detail-row"><span>Duration</span><strong>{plan.totalWeeks} Weeks</strong></div>
              <div className="pd-detail-row"><span>Total Payable</span><strong>₹{totalPayable}</strong></div>
              <div className="pd-eligibility">
                Eligibility: User becomes eligible after completing all 6 weeks of payment
              </div>
            </div>

            <div className="pd-card">
              <h2 className="pd-card-title">Benefits</h2>
              <ul className="pd-benefits">
                {plan.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Payment */}
          <div className="pd-right">
            <div className="pd-card">
              <h2 className="pd-card-title">Payment Options</h2>

              {!payMode && !fullPaid && (
                <div className="pd-pay-options">
                  <button className="pd-pay-btn pd-pay-full" onClick={() => setPayMode("full")}>
                    Pay Full Amount
                    <span>₹{totalPayable} one-time</span>
                  </button>
                  <button className="pd-pay-btn pd-pay-weekly" onClick={() => setPayMode("weekly")}>
                    Pay Weekly
                    <span>₹{plan.weeklyPremium}/week × 6 weeks</span>
                  </button>
                </div>
              )}

              {/* Full Payment */}
              {payMode === "full" && !fullPaid && (
                <div className="pd-full-pay">
                  <div className="pd-amount-box">
                    <span>Total Amount</span>
                    <strong>₹{totalPayable}</strong>
                  </div>
                  <button className="pd-confirm-btn" onClick={handleFullPay} disabled={fullPaying}>
                    {fullPaying ? "Processing..." : "Pay Now"}
                  </button>
                  <button className="pd-change-btn" onClick={() => setPayMode(null)}>Change Option</button>
                </div>
              )}

              {fullPaid && (
                <div className="pd-success">
                  <div className="pd-success-icon">✅</div>
                  <p className="pd-success-title">Payment Successful!</p>
                  <p className="pd-success-sub">₹{totalPayable} paid in full</p>
                  <div className="pd-eligible-msg">
                    You are now eligible for insurance coverage
                  </div>
                </div>
              )}

              {/* Weekly Payment */}
              {payMode === "weekly" && (
                <>
                  <div className="pd-progress-bar-wrap">
                    <div className="pd-progress-label">{paidCount} / {plan.totalWeeks} weeks completed</div>
                    <div className="pd-progress-track">
                      <div className="pd-progress-fill" style={{ width: `${(paidCount / plan.totalWeeks) * 100}%` }} />
                    </div>
                  </div>

                  <div className="pd-weeks-grid">
                    {weeks.map((status, i) => {
                      const { icon, label, cls } = weekLabel(status, i);
                      return (
                        <div key={i} className={`pd-week-card ${cls}`}>
                          <div className="pd-week-icon">{icon}</div>
                          <div className="pd-week-label">Week {i + 1}</div>
                          <div className="pd-week-status">{label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {!allPaid && (
                    <button
                      className="pd-confirm-btn"
                      onClick={handleWeekPay}
                      disabled={paying || currentPendingIndex === -1}
                    >
                      {paying ? "Processing..." : `Pay Week ${currentPendingIndex + 1}`}
                    </button>
                  )}

                  {paying && (
                    <div className="pd-pay-feedback">Processing payment...</div>
                  )}

                  {!paying && paidCount > 0 && !allPaid && (
                    <div className="pd-pay-feedback pd-pay-ok">Payment Successful ✅</div>
                  )}

                  {allPaid && (
                    <div className="pd-eligible-msg">
                      You are now eligible for insurance coverage
                    </div>
                  )}

                  <button className="pd-change-btn" onClick={() => { setPayMode(null); setWeeks(Array(6).fill("locked").fill("pending", 0, 1)); }}>
                    Change Option
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
