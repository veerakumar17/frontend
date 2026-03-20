import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRiskByLocation, getRecommendation } from "./api";
import Navbar from "./Navbar";
import "./Dashboard.css";

const PLANS = [
  { name: "Basic",    premium: 20,  payout: 300,  color: "#2C85C5" },
  { name: "Standard", premium: 35,  payout: 600,  color: "#2C85C5" },
  { name: "Premium",  premium: 50,  payout: 1000, color: "#2C85C5" },
];

const riskColor = { Low: "#22c55e", Medium: "#f59e0b", High: "#ef4444" };

export default function Dashboard() {
  const navigate = useNavigate();
  const worker   = JSON.parse(localStorage.getItem("worker") || "{}");
  const salary   = worker.weekly_salary;
  const location = worker.location;

  const [weather,  setWeather]  = useState(null);
  const [risk,     setRisk]     = useState(null);
  const [advice,   setAdvice]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [step,     setStep]     = useState("Fetching weather & risk data...");

  useEffect(() => {
    if (!salary || !location) { navigate("/"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setStep("Fetching weather & risk data...");
      const riskRes  = await getRiskByLocation(location);
      const riskData = riskRes.data;
      setWeather(riskData.features);
      setRisk({ score: riskData.risk_score, level: riskData.risk_level });

      setStep("Getting AI plan recommendation...");
      const condition =
        riskData.features.temp     > 42  ? "Extreme Heat" :
        riskData.features.rainfall > 70  ? "Heavy Rain"   :
        riskData.features.aqi      > 350 ? "Severe Pollution" : "Normal";

      const advRes = await getRecommendation(parseFloat(salary), riskData.risk_score, condition);
      setAdvice(advRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load data. Check backend.");
    } finally {
      setLoading(false);
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

  return (
    <div>
      <Navbar />
      <main className="dash-main">
        <div className="cards-row">

          <div className="card">
            <h3>Your Profile</h3>
            <div className="card-row"><span>Location</span><strong>{location}</strong></div>
            <div className="card-row"><span>Weekly Salary</span><strong>₹{salary}</strong></div>
          </div>

          <div className="card">
            <h3>Weather Conditions</h3>
            <div className="card-row"><span>Temperature</span><strong>{weather?.temp}°C</strong></div>
            <div className="card-row"><span>Humidity</span><strong>{weather?.humidity}%</strong></div>
            <div className="card-row"><span>Rainfall</span><strong>{weather?.rainfall} mm</strong></div>
            <div className="card-row"><span>Wind</span><strong>{weather?.wind} m/s</strong></div>
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
          </div>

        </div>

        <h2 className="section-title">Insurance Plans</h2>
        <div className="plans-row">
          {PLANS.map((plan) => {
            const isRecommended = advice?.recommended_plan === plan.name;
            return (
              <div
                key={plan.name}
                className={`plan-card ${isRecommended ? "plan-recommended" : ""}`}
                style={{ ...(isRecommended ? { borderColor: plan.color } : {}), cursor: "pointer" }}
                onClick={() => navigate(`/plan/${plan.name}`)}
              >
                {isRecommended && <div className="recommended-badge">Recommended</div>}
                <div className="plan-name" style={{ color: plan.color }}>{plan.name}</div>
                <div className="plan-premium">₹{plan.premium}<span>/week</span></div>
                <div className="plan-payout">Max Payout: <strong>₹{plan.payout}</strong></div>
                <div className="plan-card-hint">View Details →</div>
              </div>
            );
          })}
        </div>

        {advice && (
          <div className="advice-card">
            <div className="advice-header">
              <h3>AI Advisor Recommendation</h3>
            </div>
            <p className="advice-text">{advice.explanation}</p>
            <div className="advice-footer">
              <span>Recommended:</span>
              <strong>{advice.recommended_plan} Plan</strong>
              <span>· ₹{advice.weekly_premium}/week · Max payout ₹{advice.max_payout}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
