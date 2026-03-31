import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

const roleHomeMap = {
  uma: "/UmaHome",
  admin: "/AdminHome",
  driver: "/DriverHome",
  handler: "/HandlerHome",
  "customer service": "/CustomerServiceHome",
  customer: "/CustomerHome",
};

// Wraps public-only pages (login, register) — redirects to home if already logged in
function PublicRoute({ children }) {
  const { token, user } = useAuth();

  if (token) {
    const destination = roleHomeMap[user?.role] || "/";
    return <Navigate to={destination} replace />;
  }

  return children;
}

export default PublicRoute;
