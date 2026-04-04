import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const worker = JSON.parse(localStorage.getItem("worker") || "null");
  const admin  = JSON.parse(localStorage.getItem("admin")  || "null");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">InsureGuard</div>
      <div className="nav-links">
        {worker && (
          <>
            <NavLink to="/home"      className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Home</NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
            <NavLink to="/claims"    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>My Claims</NavLink>
            <NavLink to="/terms"     className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Terms & Conditions</NavLink>
            <NavLink to="/contact"   className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Contact</NavLink>
            <NavLink to="/profile"   className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Profile</NavLink>
          </>
        )}
        {!worker && admin && (
          <>
            <NavLink to="/admin" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
            <NavLink to="/admin/payments" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Payments</NavLink>
            <NavLink to="/admin/fraud"    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Fraud Detection</NavLink>
            <NavLink to="/admin/triggers" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Triggers</NavLink>
          </>
        )}
      </div>
      <div className="nav-actions">
        {(worker || admin) && (
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        )}
      </div>
    </nav>
  );
}
