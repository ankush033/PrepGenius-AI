import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function AppRoutes() {
  const { status } = useAuth();

  if (status === "loading") return null;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={status === "authenticated" ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={status === "authenticated" ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={status === "authenticated" ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}

export default App;
