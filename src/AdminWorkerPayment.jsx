import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getWorkersSummary, adminTriggerPayment, getPremiumHistory } from "./api";
import Navbar from "./Navbar";
import "./AdminDashboard.css";

export default function AdminWorkerPayment() {
  const { workerId } = useParams();
  const navigate     = useNavigate();

  const [worker,   setWorker]   = useState(null);
  const [premiums, setPremiums] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [paying,   setPaying]   = useState(false);
  const [message,  setMessage]  = useState(null);
  const [error,    setError]    = useState("");

  const load = async () => {
    try {
      const [sumRes, premRes] = await Promise.all([
        getWorkersSummary(),
        getPremiumHistory(workerId).catch(() => ({ data: { premiums: [] } })),
      ]);
      const found = sumRes.data.find(w => String(w.id) === String(workerId));
      if (!found) { setError("Worker not found."); return; }
      setWorker(found);
      setPremiums(premRes.data.premiums || []);
    } catch { setError("Failed to load worker."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [workerId]);

  const handlePay = async () => {
    setPaying(true);
    setMessage(null);
    try {
      const res = await adminTriggerPayment(worker.id);
      setMessage({
        ok: true,
        text: `Week ${res.data.weeks_paid} premium of Rs.${res.data.amount} deducted successfully.${res.data.is_eligible ? " Worker is now eligible for claims." : ""}`,
      });
      await load();
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.detail || "Payment failed." });
    } finally { setPaying(false); }
  };

  if (loading) return (<><Navbar /><div className="adm-loading"><div className="spinner" /></div></>);
  if (error && !worker) return (
    <><Navbar />
      <div className="adm-error">
        {error}<br />
        <button className="adm-back-btn" style={{ marginTop: 16 }} onClick={() => navigate("/admin/payments")}>Back</button>
      </div>
    </>
  );

  const paidCount  = worker.weeks_paid ?? 0;
  const isEligible = worker.is_eligible;

  return (
    <div>
      <Navbar />
      <div className="adm-container">

        <button className="adm-back-btn" onClick={() => navigate("/admin/payments")}>← Back to Payments</button>

        <div className="adm-worker-detail-header">
          <div className="adm-worker-avatar">{worker.name?.[0]?.toUpperCase()}</div>
          <div>
            <h1>{worker.name}</h1>
            <p>{worker.location} · {worker.platform} · {worker.plan} Plan</p>
          </div>
          <span className={`adm-status-badge ${isEligible ? "adm-badge-green" : "adm-badge-yellow"}`}>
            {isEligible ? "Eligible" : "Pending"}
          </span>
        </div>

        {/* Stats */}
        <div className="adm-kpi-grid" style={{ marginBottom: 28 }}>
          <div className="adm-kpi"><span>Plan</span><strong>{worker.plan}</strong></div>
          <div className="adm-kpi"><span>Weeks Paid</span><strong>{paidCount}</strong></div>
          <div className="adm-kpi adm-kpi-green"><span>Total Collected</span><strong>Rs.{worker.premium_paid?.toLocaleString("en-IN")}</strong></div>
          <div className="adm-kpi"><span>Total Claims</span><strong>{worker.total_claims}</strong></div>
          <div className="adm-kpi adm-kpi-red"><span>Total Payout</span><strong>Rs.{worker.total_payout?.toLocaleString("en-IN")}</strong></div>
        </div>

        {/* Payment action */}
        <div className="adm-payment-action-card" style={{ marginBottom: 28 }}>
          {message && (
            <div className={`adm-action-msg ${message.ok ? "adm-msg-ok" : "adm-msg-err"}`}>
              {message.text}
            </div>
          )}
          <p className="adm-payment-note">
            Deduct <strong>Week {paidCount + 1}</strong> premium of <strong>Rs.{worker.weekly_premium ?? "—"}</strong> from <strong>{worker.name}</strong>'s account.
            {paidCount + 1 === 6 && " This is the 6th payment — worker becomes eligible for claims after this."}
          </p>
          <button className="adm-pay-btn adm-pay-btn-large" onClick={handlePay} disabled={paying}>
            {paying ? "Processing..." : `Deduct Week ${paidCount + 1} Premium`}
          </button>
        </div>

        {/* Payment history table */}
        <h2 className="adm-section-title">Payment History</h2>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {premiums.length === 0 ? (
                <tr><td colSpan={4} className="adm-empty">No payments recorded yet.</td></tr>
              ) : (
                premiums.map((p, i) => (
                  <tr key={p.id}>
                    <td><strong>Week {p.week_number ?? i + 1}</strong></td>
                    <td>Rs.{p.amount}</td>
                    <td style={{ color: p.status === "paid" ? "#16a34a" : "#dc2626", fontWeight: 600, textTransform: "capitalize" }}>
                      {p.status}
                    </td>
                    <td>{new Date(p.paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
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
