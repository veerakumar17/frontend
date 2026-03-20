import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Pages.css";

export default function Profile() {
  const navigate = useNavigate();
  const worker   = JSON.parse(localStorage.getItem("worker") || "{}");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const fields = [
    { label: "Full Name",          value: worker.name              },
    { label: "Username",           value: worker.username          },
    { label: "Email",              value: worker.email             },
    { label: "Mobile Number",      value: worker.mobile            },
    { label: "Delivery Platform",  value: worker.delivery_platform },
    { label: "Location",           value: worker.location          },
    { label: "Weekly Salary",      value: `₹${worker.weekly_salary}` },
    { label: "UPI / Bank Account", value: worker.upi_id            },
  ];

  return (
    <div>
      <Navbar />
      <div className="page-container">
        <div className="profile-hero">
          <div className="profile-avatar">
            {worker.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h1>{worker.name}</h1>
            <p>@{worker.username} · {worker.delivery_platform} Partner</p>
          </div>
        </div>

        <div className="profile-card">
          <h2>Account Details</h2>
          <div className="profile-grid">
            {fields.map((f) => (
              <div className="profile-field" key={f.label}>
                <div className="profile-field-label">{f.label}</div>
                <div className="profile-field-value">{f.value || "—"}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
