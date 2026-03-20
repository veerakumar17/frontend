import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerWorker } from "./api";
import "./Auth.css";

const INITIAL = {
  username: "", password: "", name: "", email: "",
  mobile: "", delivery_platform: "Swiggy",
  location: "", weekly_salary: "", upi_id: "",
};

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8,            label: "Minimum 8 characters" },
  { test: (p) => /[A-Z]/.test(p),          label: "One uppercase letter" },
  { test: (p) => /[a-z]/.test(p),          label: "One lowercase letter" },
  { test: (p) => /[0-9]/.test(p),          label: "One digit" },
  { test: (p) => /[^A-Za-z0-9]/.test(p),   label: "One special character" },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]       = useState(INITIAL);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validatePassword = (pwd) => PASSWORD_RULES.every((r) => r.test(pwd));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    for (const key of Object.keys(INITIAL)) {
      if (!form[key]) { setError("All fields are required."); return; }
    }
    if (!validatePassword(form.password)) {
      setError("Password does not meet the requirements."); return;
    }
    setLoading(true);
    try {
      await registerWorker({ ...form, weekly_salary: parseFloat(form.weekly_salary) });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join AI Gig Worker Insurance</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Username</label>
              <input name="username" placeholder="Choose a username" value={form.username} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input name="password" type={showPwd ? "text" : "password"} placeholder="Create a password" value={form.password} onChange={handleChange} />
                <button type="button" className="toggle-pwd" onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
              {form.password && (
                <div className="pwd-rules">
                  {PASSWORD_RULES.map((r) => (
                    <span key={r.label} className={r.test(form.password) ? "rule-pass" : "rule-fail"}>
                      {r.test(form.password) ? "+" : "-"} {r.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" placeholder="Your full name" value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input name="mobile" placeholder="10-digit mobile number" value={form.mobile} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Working Platform</label>
              <select name="delivery_platform" value={form.delivery_platform} onChange={handleChange}>
                <option value="Swiggy">Swiggy</option>
                <option value="Zomato">Zomato</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location (City)</label>
              <input name="location" placeholder="e.g. Chennai" value={form.location} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Weekly Salary (₹)</label>
              <input name="weekly_salary" type="number" placeholder="e.g. 3500" value={form.weekly_salary} onChange={handleChange} />
            </div>
            <div className="form-group form-group-full">
              <label>Bank Account / UPI ID <span className="label-note">(salary account)</span></label>
              <input name="upi_id" placeholder="e.g. name@upi or account number" value={form.upi_id} onChange={handleChange} />
            </div>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
