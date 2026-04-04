import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkersSummary, adminTriggerPayment } from "./api";
import Navbar from "./Navbar";
import "./AdminDashboard.css";

export default function AdminPayments() {
  const navigate     = useNavigate();
  const [workers,    setWorkers]    = useState([]);
  const [payingId,   setPayingId]   = useState(null);
  const [payingAll,  setPayingAll]  = useState(false);
  const [messages,   setMessages]   = useState({});

  useEffect(() => {
    getWorkersSummary().then(r => setWorkers(r.data)).catch(() => {});
  }, []);

  const refresh = async () => {
    const r = await getWorkersSummary();
    setWorkers(r.data);
  };

  const handlePay = async (worker_id) => {
    setPayingId(worker_id);
    setMessages(m => ({ ...m, [worker_id]: null }));
    try {
      const res = await adminTriggerPayment(worker_id);
      setMessages(m => ({ ...m, [worker_id]: { ok: true, text: `Week ${res.data.weeks_paid} payment collected.${res.data.is_eligible ? " Now eligible for claims." : ""}` } }));
      await refresh();
    } catch (err) {
      setMessages(m => ({ ...m, [worker_id]: { ok: false, text: err.response?.data?.detail || "Payment failed." } }));
    } finally {
      setPayingId(null);
    }
  };

  const handlePayAll = async () => {
    const pending = workers.filter(w => w.plan && !w.is_eligible);
    if (pending.length === 0) return;
    setPayingAll(true);
    for (const w of pending) {
      try {
        const res = await adminTriggerPayment(w.id);
        setMessages(m => ({ ...m, [w.id]: { ok: true, text: `Week ${res.data.weeks_paid} collected.` } }));
      } catch (err) {
        setMessages(m => ({ ...m, [w.id]: { ok: false, text: err.response?.data?.detail || "Failed." } }));
      }
    }
    await refresh();
    setPayingAll(false);
  };

  const pendingCount = workers.filter(w => w.plan && !w.is_eligible).length;

  return (
    <div>
      <Navbar />
      <div className="adm-container">
        <div className="adm-header">
          <div>
            <h1>Payments</h1>
            <p>Collect weekly premiums from workers. Payment status is reflected instantly on the worker dashboard.</p>
          </div>
          {pendingCount > 0 && (
            <button className="adm-pay-all-btn" onClick={handlePayAll} disabled={payingAll}>
              {payingAll ? "Processing..." : `Collect All (${pendingCount} pending)`}
            </button>
          )}
        </div>

        <div className="adm-info-box">
          Weekly premiums are collected by the admin on behalf of workers. Once 6 weeks are paid, the worker becomes eligible for claims. Payment status updates instantly on the worker dashboard.
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Location</th>
                <th>Plan</th>
                <th>Progress</th>
                <th>Weekly Premium</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {workers.filter(w => w.plan).map(w => {
                const msg = messages[w.id];
                return (
                  <tr key={w.id} className="adm-row-clickable" onClick={() => navigate(`/admin/payments/${w.id}`)}>
                    <td><strong>{w.name}</strong></td>
                    <td>{w.location}</td>
                    <td>{w.plan}</td>
                    <td>
                      <strong>Week {w.weeks_paid}</strong>
                      {msg && <div className={`adm-inline-msg ${msg.ok ? "adm-inline-ok" : "adm-inline-err"}`}>{msg.text}</div>}
                    </td>
                    <td>Rs.{w.premium_paid > 0 ? (w.premium_paid / (w.weeks_paid || 1)).toFixed(0) : "—"}/wk</td>
                    <td style={{ color: w.is_eligible ? "#16a34a" : "#d97706", fontWeight: 600 }}>
                      {w.is_eligible ? "Eligible" : "Pending"}
                    </td>
                    <td>
                      {w.is_eligible
                        ? <span className="adm-eligible-tag">Fully Active</span>
                        : (
                          <button
                            className="adm-pay-btn"
                            onClick={() => handlePay(w.id)}
                            disabled={payingId === w.id || payingAll}
                          >
                            {payingId === w.id ? "Processing..." : `Collect Week ${w.weeks_paid + 1}`}
                          </button>
                        )
                      }
                    </td>
                  </tr>
                );
              })}
              {workers.filter(w => w.plan).length === 0 && (
                <tr><td colSpan={7} className="adm-empty">No workers with active policies.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
