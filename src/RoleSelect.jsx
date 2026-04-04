import { useNavigate } from "react-router-dom";
import "./Auth.css";
import "./RoleSelect.css";

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="role-card">
        <div className="auth-header">
          <h1>InsureGuard</h1>
          <p>Who are you signing in as?</p>
        </div>
        <div className="role-options">
          <button className="role-btn role-worker" onClick={() => navigate("/login")}>
            <strong>Worker</strong>
            <small>Delivery partner login</small>
          </button>
          <button className="role-btn role-admin" onClick={() => navigate("/admin-login")}>
            <strong>Admin</strong>
            <small>Insurer / admin login</small>
          </button>
        </div>
      </div>
    </div>
  );
}
