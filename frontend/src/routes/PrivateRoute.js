import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

// Wraps protected pages — redirects to /login if not authenticated,
// or to / if authenticated but not the required role
function PrivateRoute({ children, allowedRoles }) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;
