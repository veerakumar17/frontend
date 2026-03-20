import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import Login      from "./Login";
import Register   from "./Register";
import Home       from "./Home";
import Dashboard  from "./Dashboard";
import Terms      from "./Terms";
import Contact    from "./Contact";
import Profile    from "./Profile";
import PlanDetail from "./PlanDetail";

const PrivateRoute = ({ children }) =>
  localStorage.getItem("worker") ? children : <Navigate to="/" />;

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"               element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/home"           element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/dashboard"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/plan/:planName" element={<PrivateRoute><PlanDetail /></PrivateRoute>} />
          <Route path="/terms"          element={<PrivateRoute><Terms /></PrivateRoute>} />
          <Route path="/contact"        element={<PrivateRoute><Contact /></PrivateRoute>} />
          <Route path="/profile"        element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*"               element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
