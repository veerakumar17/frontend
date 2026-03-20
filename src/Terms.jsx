import Navbar from "./Navbar";
import "./Pages.css";

const terms = [
  {
    title: "6-Week Minimum Waiting Period",
    content: `Workers must pay premiums for 6 consecutive weeks before becoming eligible for claims. Coverage becomes fully active from Week 7 onwards.

This prevents users from joining only when disruptions are predicted.`,
  },
  {
    title: "Automatic Premium Deduction",
    content: `Workers provide their bank account or UPI ID during registration. The system auto-debits the weekly premium to ensure uninterrupted coverage.

Ensure your registered UPI/bank account has sufficient balance every week before the deduction date.`,
  },
  {
    title: "Payment Failure & Grace Period",
    content: `If a deduction fails due to insufficient balance:

• A 2-day grace period is initiated
• Worker is notified: "Premium payment failed. Please add balance within 2 days to continue coverage."
• Any disruption claim during grace period is set to Pending status
• If payment succeeds within 2 days → policy remains active → pending claim is approved and payout is processed
• If payment is not completed after 2 days → policy remains active with a risk-based daily interest penalty applied, pending claims continue to remain in Pending state until payment is completed
• Once balance is available → system auto-deducts pending premium + accumulated interest → policy becomes fully active and pending claims are processed`,
  },
  {
    title: "Parametric Trigger Conditions",
    content: `Claims are automatically triggered when any of the following environmental thresholds are crossed in your registered delivery zone:

• Rainfall > 70 mm
• Temperature > 42°C
• AQI > 350
• Flood Alert issued

No manual claim filing is required. The system detects and processes claims automatically.`,
  },
  {
    title: "Payout Policy",
    content: `Payout amounts are fixed per plan:

• Basic Plan — ₹300 maximum weekly payout
• Standard Plan — ₹600 maximum weekly payout
• Premium Plan — ₹1000 maximum weekly payout

Payouts are credited to your registered UPI/bank account within the processing period.`,
  },
  {
    title: "Data Privacy",
    content: `Your personal information including name, mobile number, UPI ID, and salary details are stored securely and used solely for insurance processing purposes.

We do not share your data with third parties without your consent.`,
  },
];

export default function Terms() {
  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1>Terms & Conditions</h1>
          <p>Please read these terms carefully before using the AI Gig Worker Insurance platform.</p>
        </div>
        <div className="terms-list">
          {terms.map((t) => (
            <div className="terms-card" key={t.title}>
              <div className="terms-title">
                <h3>{t.title}</h3>
              </div>
              <p className="terms-content">{t.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
