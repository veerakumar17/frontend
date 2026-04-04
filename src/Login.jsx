import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWorker } from "./api";
import "./Auth.css";
import "./RoleSelect.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ username: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username || !form.password) { setError("All fields are required."); return; }
    setLoading(true);
    try {
      const res = await loginWorker(form);
      localStorage.setItem("worker", JSON.stringify(res.data.worker));
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="back-link" onClick={() => navigate("/")}>← Back</button>
        <div className="auth-header">
          <h1>InsureGuard</h1>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input name="username" placeholder="Enter your username" value={form.username} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" placeholder="Enter your password" value={form.password} onChange={handleChange} />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
