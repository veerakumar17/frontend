import Navbar from "./Navbar";
import "./Pages.css";

const features = [
  { title: "Parametric Triggers",     desc: "Claims auto-triggered when rainfall >70mm, temperature >42°C, AQI >350, or flood alert is detected." },
  { title: "AI Risk Prediction",       desc: "Machine learning models analyze real-time weather and pollution data to assess your delivery zone risk." },
  { title: "Smart Plan Advisor",        desc: "LLaMA3 AI recommends the best insurance plan based on your salary, location risk, and weather conditions." },
  { title: "Auto Premium Deduction",   desc: "Weekly premium is automatically deducted from your registered UPI/bank account — no manual payments needed." },
  { title: "6-Week Eligibility",       desc: "Pay premiums for 6 consecutive weeks to activate full claim eligibility. Coverage starts from Week 7." },
  { title: "Grace Period Protection",  desc: "2-day grace period on failed payments. Disruption claims during grace period are held as Pending." },
];

const steps = [
  { step: "01", title: "Register",         desc: "Create your account with your delivery platform details and UPI ID." },
  { step: "02", title: "Choose a Plan",    desc: "Select Basic, Standard, or Premium based on your income needs." },
  { step: "03", title: "Pay 6 Weeks",      desc: "Auto-pay weekly premiums for 6 weeks to become claim-eligible." },
  { step: "04", title: "Get Protected",    desc: "System monitors weather 24/7. Disruption detected → claim auto-created → payout sent." },
];

export default function Home() {
  return (
    <div>
      <Navbar />
      <div className="page-container">

        {/* Hero */}
        <div className="hero">
          <div className="hero-badge">AI-Powered Income Protection</div>
          <h1 className="hero-title">Insurance Built for<br /><span>Gig Delivery Workers</span></h1>
          <p className="hero-sub">
            Protect your weekly income from environmental disruptions like heavy rain, extreme heat,
            floods, and severe pollution. Automatic claims. No paperwork.
          </p>
          <div className="hero-stats">
            <div className="stat"><strong>₹300–₹1000</strong><span>Weekly Payout</span></div>
            <div className="stat-divider" />
            <div className="stat"><strong>₹20–₹50</strong><span>Weekly Premium</span></div>
            <div className="stat-divider" />
            <div className="stat"><strong>6 Weeks</strong><span>To Eligibility</span></div>
          </div>
        </div>

        {/* How it works */}
        <h2 className="section-heading">How It Works</h2>
        <div className="steps-grid">
          {steps.map((s) => (
            <div className="step-card" key={s.step}>
              <div className="step-number">{s.step}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <h2 className="section-heading">Platform Features</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Trigger thresholds */}
        <h2 className="section-heading">Disruption Trigger Thresholds</h2>
        <div className="trigger-grid">
          {[
            { label: "Rainfall",    value: "> 70 mm" },
            { label: "Temperature", value: "> 42°C" },
            { label: "AQI",          value: "> 350" },
            { label: "Flood Alert",  value: "Active" },
          ].map((t) => (
            <div className="trigger-card" key={t.label}>
              <strong>{t.label}</strong>
              <div className="trigger-value">{t.value}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
