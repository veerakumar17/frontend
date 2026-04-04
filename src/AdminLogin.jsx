import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin, adminRegister } from "./api";
import "./Auth.css";
import "./RoleSelect.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [tab,     setTab]     = useState("login");
  const [form,    setForm]    = useState({ name: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.password) { setError("All fields are required."); return; }
    setLoading(true);
    try {
      if (tab === "login") {
        const res = await adminLogin(form);
        localStorage.setItem("admin", JSON.stringify(res.data.admin));
        navigate("/admin");
      } else {
        await adminRegister(form);
        setTab("login");
        setForm({ name: "", password: "" });
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.detail || (tab === "login" ? "Login failed." : "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="back-link" onClick={() => navigate("/")}>← Back</button>
        <div className="auth-header">
          <h1>Admin Portal</h1>
          <p>Insurer / admin access</p>
        </div>

        <div className="adm-auth-tabs">
          <button className={tab === "login" ? "adm-auth-tab active" : "adm-auth-tab"} onClick={() => { setTab("login"); setError(""); }}>Sign In</button>
          <button className={tab === "register" ? "adm-auth-tab active" : "adm-auth-tab"} onClick={() => { setTab("register"); setError(""); }}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Name</label>
            <input name="name" placeholder="Admin name" value={form.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Please wait..." : tab === "login" ? "Sign In →" : "Register →"}
          </button>
        </form>
      </div>
    </div>
  );
}
