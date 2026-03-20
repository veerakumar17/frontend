import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const worker = JSON.parse(localStorage.getItem("worker") || "null");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-logo">AI Gig Insurance</div>
      <div className="nav-links">
        <NavLink to="/home"       className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Home</NavLink>
        <NavLink to="/dashboard"  className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
        <NavLink to="/terms"      className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Terms & Conditions</NavLink>
        <NavLink to="/contact"    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Contact</NavLink>
        <NavLink to="/profile"    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Profile</NavLink>
      </div>
      <div className="nav-actions">
        {worker && (
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        )}
      </div>
    </nav>
  );
}
