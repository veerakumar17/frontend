import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getClaims, getPolicy, createPayoutOrder, verifyPayout, processClaimPayout } from "./api";
import Navbar from "./Navbar";
import "./Triggers.css";

const POLL_INTERVAL = 30000;

const STATUS_CONFIG = {
  Approved: { color: "#16a34a", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.3)"  },
  Pending:  { color: "#d97706", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  Rejected: { color: "#dc2626", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)"  },
};

const PAYOUT_CONFIG = {
  processed: { color: "#16a34a", label: "✅ Payout Sent"    },
  pending:   { color: "#d97706", label: "⏳ Payout Pending" },
  failed:    { color: "#dc2626", label: "❌ Payout Failed"  },
};

const TRIGGER_LABELS = {
  rainfall:    "Heavy Rain",
  temperature: "Extreme Heat",
  aqi:         "Severe Pollution",
  flood:       "Flood Alert",
};

const sourceLabel = (triggered_by) => {
  if (!triggered_by || triggered_by === "simulation") return null;
  if (triggered_by === "auto") return "Auto-triggered by live weather monitoring";
  if (triggered_by.startsWith("admin:")) return `Triggered by ${triggered_by.replace("admin:", "Admin: ")}`;
  return null;
};

export default function MyClaims() {
  const navigate = useNavigate();
  const worker   = JSON.parse(localStorage.getItem("worker") || "{}");

  const [claims,     setClaims]     = useState([]);
  const [policy,     setPolicy]     = useState(null);
  const [toast,      setToast]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const knownIds = useRef(new Set());

  useEffect(() => {
    if (!worker.id) { navigate("/"); return; }
    init();
  }, []);

  useEffect(() => {
    if (!worker.id) return;
    const interval = setInterval(async () => {
      try {
        const res     = await getClaims(worker.id);
        const latest  = res.data;
        const newOnes = latest.filter(c => !knownIds.current.has(c.id));
        if (newOnes.length > 0) {
          newOnes.forEach(c => knownIds.current.add(c.id));
          setClaims(latest);
          // Auto-process payout for new approved claims
          const toProcess = newOnes.filter(c => c.status === "Approved" && c.payout_status !== "processed");
          for (const c of toProcess) {
            try {
              await openRazorpayCheckout(c.id);
            } catch {
              const label = TRIGGER_LABELS[c.trigger_type] || c.trigger_type;
              setToast(`🔔 New claim: ${label} — ₹${c.payout_amount} ${c.status}`);
              setTimeout(() => setToast(null), 8000);
            }
          }
        }
      } catch { /* silent */ }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [worker.id]);

  const init = async () => {
    try {
      const clmRes = await getClaims(worker.id).catch(() => ({ data: [] }));
      const claims = clmRes.data;
      setClaims(claims);
      claims.forEach(c => knownIds.current.add(c.id));
      // Auto-process any approved but unpaid payouts
      autoProcessPayouts(claims);
      try {
        const polRes = await getPolicy(worker.id);
        setPolicy(polRes.data);
      } catch { /* no policy */ }
    } finally {
      setLoading(false);
    }
  };

  const autoProcessPayouts = async (claimsList) => {
    const unpaid = claimsList.filter(c => c.status === "Approved" && c.payout_status !== "processed");
    for (const c of unpaid) {
      try {
        await openRazorpayCheckout(c.id);
      } catch { /* silent */ }
    }
  };

  const openRazorpayCheckout = (claim_id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const orderRes = await createPayoutOrder(claim_id);
        const order    = orderRes.data;

        const options = {
          key:         order.key_id,
          amount:      order.amount * 100,
          currency:    "INR",
          name:        "InsureNet",
          description: "Insurance Claim Payout",
          order_id:    order.order_id,
          prefill: {
            name:    order.worker_name,
            email:   order.worker_email,
            contact: order.worker_mobile,
          },
          notes: { upi_id: order.upi_id },
          theme: { color: "#2C85C5" },
          handler: async (response) => {
            try {
              const verifyRes = await verifyPayout(claim_id, {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              });
              setClaims(prev => prev.map(x => x.id === claim_id ? verifyRes.data : x));
              setToast(`✅ ₹${order.amount} payout sent! Txn: ${response.razorpay_payment_id}`);
              setTimeout(() => setToast(null), 8000);
              resolve();
            } catch { reject(); }
          },
          modal: {
            ondismiss: async () => {
              // fallback: mark as processed with order ID
              try {
                const res = await processClaimPayout(claim_id);
                setClaims(prev => prev.map(x => x.id === claim_id ? res.data : x));
              } catch { /* silent */ }
              resolve();
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        // fallback if Razorpay order creation fails
        try {
          const res = await processClaimPayout(claim_id);
          setClaims(prev => prev.map(x => x.id === claim_id ? res.data : x));
        } catch { /* silent */ }
        resolve();
      }
    });
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="trig-loading"><div className="spinner" /></div>
    </>
  );

  return (
    <div>
      <Navbar />
      <div className="trig-container">

        <div className="trig-header">
          <h1>My Claims</h1>
          <p>Claims are automatically created when a disruption trigger is activated. Payouts are sent instantly to your UPI ID.</p>
        </div>

        {toast && <div className="trig-toast">{toast}</div>}

        {!policy && (
          <div className="trig-banner trig-banner-warn">
            <div>
              <strong>No active policy</strong>
              <p>Go to <span className="trig-link" onClick={() => navigate("/dashboard")}>Dashboard</span> to activate a plan.</p>
            </div>
          </div>
        )}

        {policy && !policy.is_eligible && (
          <div className="trig-banner trig-banner-warn">
            <div>
              <strong>{policy.weeks_paid}/6 weeks paid — not yet eligible</strong>
              <p>Claims will be processed once you complete 6 weekly payments.</p>
            </div>
          </div>
        )}

        {policy && policy.is_eligible && (
          <div className="trig-banner trig-banner-ok">
            <div>
              <strong>Coverage Active — {policy.plan} Plan</strong>
              <p>Max payout ₹{policy.max_payout}/week. Claims fire automatically when disruptions are detected.</p>
            </div>
          </div>
        )}

        {claims.length > 0 ? (
          <>
            <h2 className="trig-section-title">Claims History</h2>
            <div className="trig-claims">
              {claims.slice().reverse().map((c) => {
                const cfg    = STATUS_CONFIG[c.status] || STATUS_CONFIG.Approved;
                const label  = TRIGGER_LABELS[c.trigger_type] || c.trigger_type;
                const source = sourceLabel(c.triggered_by);
                const payout = PAYOUT_CONFIG[c.payout_status] || PAYOUT_CONFIG.Pending;
                const canPay = c.status === "Approved" && c.payout_status !== "processed";
                return (
                  <div key={c.id} className="trig-claim-row">
                    <div className="trig-claim-id">#{c.id}</div>
                    <div className="trig-claim-info">
                      <strong>{label}</strong>
                      <span>{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      {source && <span className="trig-claim-source">{source}</span>}
                      {c.payout_status === "processed" && c.payout_transaction_id && (
                        <div className="trig-upi-receipt">
                          <span className="trig-upi-label">UPI Payout Receipt</span>
                          <span>Txn ID: <strong>{c.payout_transaction_id}</strong></span>
                          <span>Sent to: <strong>{worker.upi_id}</strong></span>
                          {c.payout_processed_at && (
                            <span>Time: <strong>{new Date(c.payout_processed_at).toLocaleString("en-IN")}</strong></span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="trig-claim-payout">₹{c.payout_amount}</div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <div className="trig-claim-status" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                        {c.status}
                      </div>
                      <div style={{ fontSize: 12, color: payout.color, fontWeight: 600 }}>
                        {payout.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="trig-no-claims">
            No claims yet. Claims will appear here automatically when a disruption is detected in your area.
          </div>
        )}

      </div>
    </div>
  );
}
