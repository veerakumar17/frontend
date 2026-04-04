import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import RoleSelect     from "./RoleSelect";
import Login          from "./Login";
import Register       from "./Register";
import Home           from "./Home";
import Dashboard      from "./Dashboard";
import Terms          from "./Terms";
import Contact        from "./Contact";
import Profile        from "./Profile";
import PlanDetail     from "./PlanDetail";
import Triggers       from "./Triggers";
import AdminLogin     from "./AdminLogin";
import AdminDashboard  from "./AdminDashboard";
import AdminPayments  from "./AdminPayments";
import AdminTriggers  from "./AdminTriggers";
import AdminWorkerPayment from "./AdminWorkerPayment";
import AdminFraudDetection from "./AdminFraudDetection";

const PrivateRoute = ({ children }) =>
  localStorage.getItem("worker") ? children : <Navigate to="/" />;

const AdminRoute = ({ children }) =>
  localStorage.getItem("admin") ? children : <Navigate to="/admin-login" />;

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"               element={<RoleSelect />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/admin-login"    element={<AdminLogin />} />
          <Route path="/home"           element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/dashboard"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/plan/:planName" element={<PrivateRoute><PlanDetail /></PrivateRoute>} />
          <Route path="/claims"       element={<PrivateRoute><Triggers /></PrivateRoute>} />
          <Route path="/terms"          element={<PrivateRoute><Terms /></PrivateRoute>} />
          <Route path="/contact"        element={<PrivateRoute><Contact /></PrivateRoute>} />
          <Route path="/profile"        element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/admin"           element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/payments"              element={<AdminRoute><AdminPayments /></AdminRoute>} />
          <Route path="/admin/payments/:workerId"    element={<AdminRoute><AdminWorkerPayment /></AdminRoute>} />
          <Route path="/admin/fraud"                 element={<AdminRoute><AdminFraudDetection /></AdminRoute>} />
          <Route path="/admin/triggers"              element={<AdminRoute><AdminTriggers /></AdminRoute>} />
          <Route path="*"               element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
